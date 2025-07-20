import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

jest.mock('fs');
jest.mock('os');

// Promisifiedされた関数のモック
const mockStat = jest.fn();
const mockCopyFile = jest.fn();

jest.mock('util', () => ({
    promisify: jest.fn((fn: any) => {
        // 関数名で判定
        if (fn && fn.name === 'stat') return mockStat;
        if (fn && fn.name === 'copyFile') return mockCopyFile;
        return jest.fn();
    })
}));

import { createDestinationFolder, copyFilesDifferential } from '../src/fileOperations';

describe('fileOperations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('createDestinationFolder', () => {
        it('デスクトップにYYYYMMDD形式のフォルダパスを返す', () => {
            const mockHomedir = '/Users/test';
            jest.mocked(os.homedir).mockReturnValue(mockHomedir);
            jest.mocked(fs.existsSync).mockReturnValue(false);
            jest.mocked(fs.mkdirSync).mockImplementation();

            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const expectedFolder = `${year}${month}${day}`;

            const result = createDestinationFolder();

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
            jest.mocked(fs.existsSync).mockReturnValue(false);
            mockStat.mockClear();
            mockCopyFile.mockClear().mockResolvedValue(undefined);
        });

        it('新規ファイルをコピーする', async () => {
            jest.mocked(fs.existsSync).mockReturnValue(false);

            const result = await copyFilesDifferential(mockSourceFiles, mockDestinationFolder);

            expect(result.copiedCount).toBe(2);
            expect(result.skippedCount).toBe(0);
            expect(mockCopyFile).toHaveBeenCalledTimes(2);
        });

        it('同名同サイズのファイルをスキップする', async () => {
            jest.mocked(fs.existsSync).mockReturnValue(true);
            mockStat
                .mockResolvedValueOnce({ size: 1000 }) // source file
                .mockResolvedValueOnce({ size: 1000 }); // destination file

            const result = await copyFilesDifferential([mockSourceFiles[0]], mockDestinationFolder);

            expect(result.copiedCount).toBe(0);
            expect(result.skippedCount).toBe(1);
            expect(mockCopyFile).not.toHaveBeenCalled();
        });

        it('同名異サイズのファイルを上書きする', async () => {
            jest.mocked(fs.existsSync).mockReturnValue(true);
            mockStat
                .mockResolvedValueOnce({ size: 2000 }) // source file
                .mockResolvedValueOnce({ size: 1000 }); // destination file

            const result = await copyFilesDifferential([mockSourceFiles[0]], mockDestinationFolder);

            expect(result.copiedCount).toBe(1);
            expect(result.skippedCount).toBe(0);
            expect(mockCopyFile).toHaveBeenCalledTimes(1);
        });

        it('混在パターン（新規・スキップ・上書き）を正しく処理する', async () => {
            const mockFiles = ['/source/new.dng', '/source/same.dng', '/source/different.dng'];
            
            jest.mocked(fs.existsSync)
                .mockReturnValueOnce(false) // new.dng: 存在しない
                .mockReturnValueOnce(true)  // same.dng: 存在する
                .mockReturnValueOnce(true); // different.dng: 存在する

            mockStat
                .mockResolvedValueOnce({ size: 1500 }) // same.dng source
                .mockResolvedValueOnce({ size: 1500 }) // same.dng dest (同サイズ)
                .mockResolvedValueOnce({ size: 2500 }) // different.dng source
                .mockResolvedValueOnce({ size: 1000 }); // different.dng dest (異サイズ)

            const result = await copyFilesDifferential(mockFiles, mockDestinationFolder);

            expect(result.copiedCount).toBe(2); // new.dng + different.dng
            expect(result.skippedCount).toBe(1); // same.dng
            expect(mockCopyFile).toHaveBeenCalledTimes(2);
        });
    });
});