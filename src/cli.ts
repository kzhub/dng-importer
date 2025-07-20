import type { Options } from './types';

export const parseArgs = (): Options => {
    const args = process.argv.slice(2);
    const options: Options = {
        path: null,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-p' || args[i] === '--path') {
            options.path = args[i + 1];
            i++;
        } else if (args[i] === '-h' || args[i] === '--help') {
            options.help = true;
        } else if (!args[i].startsWith('-') && !options.path) {
            // 最初の非オプション引数をパスとして扱う
            options.path = args[i];
        }
    }
    
    return options;
};

export const showHelp = (): void => {
    console.log(`
使用方法: yarn start <path>
         yarn start -- -p <path>

引数:
  <path>             SDカードのパス (必須)

オプション:
  -p, --path <path>  SDカードのパスを指定
  -h, --help         このヘルプメッセージを表示

例:
  yarn start /Volumes/EOS_DIGITAL
  yarn start -- -p /Volumes/EOS_DIGITAL
`);
};