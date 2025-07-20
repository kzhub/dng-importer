import type { Options } from './types';

export const parseArgs = (): Options => {
    const args = process.argv.slice(2);
    const options: Options = {
        path: null,
        help: false,
        date: null
    };
    
    const argMap: { [key: string]: keyof Options } = {
        '-p': 'path',
        '--path': 'path',
        '-d': 'date',
        '--date': 'date',
        '-h': 'help',
        '--help': 'help'
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const optionKey = argMap[arg];
        
        if (optionKey) {
            if (optionKey === 'help') {
                options[optionKey] = true;
            } else {
                options[optionKey] = args[i + 1];
                i++;
            }
        } else if (!arg.startsWith('-') && !options.path) {
            // 最初の非オプション引数をパスとして扱う
            options.path = arg;
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
  -d, --date <date>  対象日付を指定 (YYYY-MM-DD形式、デフォルト: 今日)
  -h, --help         このヘルプメッセージを表示

例:
  yarn start /Volumes/EOS_DIGITAL
  yarn start -- -p /Volumes/EOS_DIGITAL
  yarn start -- -p /Volumes/EOS_DIGITAL -d 2024-03-15
  copy-dng /Volumes/EOS_DIGITAL -d 2024-03-15
`);
};