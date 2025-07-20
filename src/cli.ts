import type { Options } from './types';

export const parseDate = (dateStr: string | null): Date => {
    if (!dateStr) {
        return new Date();
    }
    
    // YYYY-MM-DD形式をパース
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        console.error(`Error: 日付は YYYY-MM-DD 形式で指定してください (例: 2024-03-15)`);
        process.exit(1);
    }
    
    const [_, year, month, day] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // 有効な日付かチェック
    if (isNaN(date.getTime())) {
        console.error(`Error: 無効な日付です: ${dateStr}`);
        process.exit(1);
    }
    
    return date;
};

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