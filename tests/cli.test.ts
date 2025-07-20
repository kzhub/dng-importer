import { parseArgs, showHelp } from '../src/cli';

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
        });

        it('-pオプションでパスを指定できる', () => {
            process.argv.push('-p', '/Volumes/SD_CARD');
            const result = parseArgs();
            expect(result.path).toBe('/Volumes/SD_CARD');
        });

        it('-hオプションでヘルプフラグが立つ', () => {
            process.argv.push('-h');
            const result = parseArgs();
            expect(result.help).toBe(true);
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