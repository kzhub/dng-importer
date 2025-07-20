import { parseArgs, showHelp } from '../src/cli';
import { parseDate } from '../src/utils';

describe('cli', () => {
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
            const result = parseArgs();
            expect(result.path).toBe('/Volumes/EOS_DIGITAL');
            expect(result.help).toBe(false);
            expect(result.date).toBe(null);
        });

        it('-pオプションでパスを指定できる', () => {
            process.argv.push('-p', '/Volumes/SD_CARD');
            const result = parseArgs();
            expect(result.path).toBe('/Volumes/SD_CARD');
        });

        it('-dオプションで日付を指定できる', () => {
            process.argv.push('/Volumes/EOS_DIGITAL', '-d', '2024-03-15');
            const result = parseArgs();
            expect(result.path).toBe('/Volumes/EOS_DIGITAL');
            expect(result.date).toBe('2024-03-15');
        });

        it('-hオプションでヘルプフラグが立つ', () => {
            process.argv.push('-h');
            const result = parseArgs();
            expect(result.help).toBe(true);
        });
    });

    describe('parseDate', () => {
        it('nullを渡すと今日の日付を返す', () => {
            const result = parseDate(null);
            const today = new Date();
            expect(result.toDateString()).toBe(today.toDateString());
        });

        it('YYYY-MM-DD形式の文字列を正しくパースする', () => {
            const result = parseDate('2024-03-15');
            expect(result.getFullYear()).toBe(2024);
            expect(result.getMonth()).toBe(2); // 0-indexed
            expect(result.getDate()).toBe(15);
        });

        it('無効な形式の場合はエラーで終了する', () => {
            const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
                throw new Error(`Process exit with code ${code}`);
            });
            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

            expect(() => parseDate('invalid-date')).toThrow('Process exit with code 1');
            expect(mockConsoleError).toHaveBeenCalledWith(
                'Error: 日付は YYYY-MM-DD 形式で指定してください (例: 2024-03-15)'
            );

            mockExit.mockRestore();
            mockConsoleError.mockRestore();
        });
    });

    describe('showHelp', () => {
        it('ヘルプメッセージを表示する', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            showHelp();
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});