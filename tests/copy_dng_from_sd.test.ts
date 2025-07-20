import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Promisifiedされた関数のモック
const mockStat = jest.fn();
const mockCopyFile = jest.fn();

jest.mock('fs');
jest.mock('os');
jest.mock('util', () => ({
    promisify: jest.fn((fn) => {
        if (fn === fs.stat) return mockStat;
        if (fn === fs.copyFile) return mockCopyFile;
        return jest.fn();
    })
}));

// 簡単なテストのためにrequireを使用
const copyModule = require('../copy_dng_from_sd');

describe('copy_dng_from_sd', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('parseArgs', () => {
        const originalArgv = process.argv;

        beforeEach(() => {
            process.argv = ['node', 'script.js'];
        });

        afterEach(() => {
            process.argv = originalArgv;
        });

        it('パスを直接引数として受け取る', () => {
            process.argv.push('/Volumes/EOS_DIGITAL');
            const result = copyModule.parseArgs();
            expect(result.path).toBe('/Volumes/EOS_DIGITAL');
            expect(result.help).toBe(false);
        });

        it('-pオプションでパスを指定できる', () => {
            process.argv.push('-p', '/Volumes/SD_CARD');
            const result = copyModule.parseArgs();
            expect(result.path).toBe('/Volumes/SD_CARD');
        });

        it('-hオプションでヘルプフラグが立つ', () => {
            process.argv.push('-h');
            const result = copyModule.parseArgs();
            expect(result.help).toBe(true);
        });
    });

    describe('createDestinationFolder', () => {
        it('デスクトップにYYYYMMDD形式のフォルダパスを返す', () => {
            const mockHomedir = '/Users/test';
            const mockOsHomedir = os.homedir as jest.Mock;
            mockOsHomedir.mockReturnValue(mockHomedir);
            const mockFsExistsSync = fs.existsSync as jest.Mock;
            mockFsExistsSync.mockReturnValue(false);
            const mockFsMkdirSync = fs.mkdirSync as jest.Mock;
            mockFsMkdirSync.mockImplementation();

            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const expectedFolder = `${year}${month}${day}`;

            const result = copyModule.createDestinationFolder();

            expect(result).toBe(path.join(mockHomedir, 'Desktop', expectedFolder));
            expect(fs.mkdirSync).toHaveBeenCalledWith(
                path.join(mockHomedir, 'Desktop', expectedFolder),
                { recursive: true }
            );
        });
    });

    describe('copyFilesDifferential', () => {
        const mockSourceFiles = ['/source/file1.dng', '/source/file2.dng'];
        const mockDestinationFolder = '/dest';

        beforeEach(() => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            mockStat.mockClear();
            mockCopyFile.mockClear().mockResolvedValue(undefined);
        });

        it('新規ファイルをコピーする', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            const result = await copyModule.copyFilesDifferential(mockSourceFiles, mockDestinationFolder);

            expect(result.copiedCount).toBe(2);
            expect(result.skippedCount).toBe(0);
            expect(mockCopyFile).toHaveBeenCalledTimes(2);
        });

        it('同名同サイズのファイルをスキップする', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            mockStat
                .mockResolvedValueOnce({ size: 1000 }) // source file
                .mockResolvedValueOnce({ size: 1000 }); // destination file

            const result = await copyModule.copyFilesDifferential([mockSourceFiles[0]], mockDestinationFolder);

            expect(result.copiedCount).toBe(0);
            expect(result.skippedCount).toBe(1);
            expect(mockCopyFile).not.toHaveBeenCalled();
        });

        it('同名異サイズのファイルを上書きする', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            mockStat
                .mockResolvedValueOnce({ size: 2000 }) // source file
                .mockResolvedValueOnce({ size: 1000 }); // destination file

            const result = await copyModule.copyFilesDifferential([mockSourceFiles[0]], mockDestinationFolder);

            expect(result.copiedCount).toBe(1);
            expect(result.skippedCount).toBe(0);
            expect(mockCopyFile).toHaveBeenCalledTimes(1);
        });

        it('混在パターン（新規・スキップ・上書き）を正しく処理する', async () => {
            const mockFiles = ['/source/new.dng', '/source/same.dng', '/source/different.dng'];
            
            (fs.existsSync as jest.Mock)
                .mockReturnValueOnce(false) // new.dng: 存在しない
                .mockReturnValueOnce(true)  // same.dng: 存在する
                .mockReturnValueOnce(true); // different.dng: 存在する

            mockStat
                .mockResolvedValueOnce({ size: 1500 }) // same.dng source
                .mockResolvedValueOnce({ size: 1500 }) // same.dng dest (同サイズ)
                .mockResolvedValueOnce({ size: 2500 }) // different.dng source
                .mockResolvedValueOnce({ size: 1000 }); // different.dng dest (異サイズ)

            const result = await copyModule.copyFilesDifferential(mockFiles, mockDestinationFolder);

            expect(result.copiedCount).toBe(2); // new.dng + different.dng
            expect(result.skippedCount).toBe(1); // same.dng
            expect(mockCopyFile).toHaveBeenCalledTimes(2);
        });
    });
});