#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

interface Options {
    path: string | null;
    help: boolean;
}

interface CopyResult {
    copiedCount: number;
    skippedCount: number;
}

const parseArgs = (): Options => {
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

const showHelp = (): void => {
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


const findDNGFiles = async (volumePath: string, todayOnly: boolean = true): Promise<string[]> => {
    const dngFiles: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const searchDir = async (dir: string): Promise<void> => {
        try {
            const files = await readdir(dir);
            
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = await stat(filePath);
                
                if (stats.isDirectory()) {
                    await searchDir(filePath);
                } else if (file.toLowerCase().endsWith('.dng')) {
                    if (todayOnly) {
                        const fileDate = new Date(stats.mtime);
                        fileDate.setHours(0, 0, 0, 0);
                        if (fileDate.getTime() === today.getTime()) {
                            dngFiles.push(filePath);
                        }
                    } else {
                        dngFiles.push(filePath);
                    }
                }
            }
        } catch (error) {
            // 読み取れないディレクトリはスキップ
        }
    };
    
    await searchDir(volumePath);
    return dngFiles;
};

const createDestinationFolder = (): string => {
    const desktop = path.join(os.homedir(), 'Desktop');
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const folderName = `${year}${month}${day}`;
    
    const destinationPath = path.join(desktop, folderName);
    
    if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath, { recursive: true });
    }
    
    return destinationPath;
};

const copyFilesDifferential = async (sourceFiles: string[], destinationFolder: string): Promise<CopyResult> => {
    let copiedCount = 0;
    let skippedCount = 0;
    
    console.log('\n=== 重複チェックとコピー処理 ===');
    console.log('重複判定: ファイル名とファイルサイズで判定します');
    console.log('');
    
    for (const sourceFile of sourceFiles) {
        const filename = path.basename(sourceFile);
        const destinationFile = path.join(destinationFolder, filename);
        
        try {
            if (fs.existsSync(destinationFile)) {
                const sourceStats = await stat(sourceFile);
                const destStats = await stat(destinationFile);
                
                if (sourceStats.size === destStats.size) {
                    console.log(`⏭️  スキップ: ${filename} (既存: ${destStats.size} bytes)`);
                    skippedCount++;
                    continue;
                } else {
                    console.log(`🔄 上書き: ${filename} (元: ${sourceStats.size} bytes, 既存: ${destStats.size} bytes)`);
                }
            } else {
                console.log(`📋 新規コピー: ${filename}`);
            }
            
            await copyFile(sourceFile, destinationFile);
            copiedCount++;
        } catch (error) {
            console.error(`❌ エラー ${filename}:`, (error as Error).message);
        }
    }
    
    return { copiedCount, skippedCount };
};


const main = async (): Promise<void> => {
    const options = parseArgs();
    
    if (options.help) {
        showHelp();
        process.exit(0);
    }
    
    // パスが指定されていない場合はエラー
    if (!options.path) {
        console.error('Error: SDカードのパスを指定してください。');
        console.error('使用方法: yarn start /Volumes/EOS_DIGITAL');
        console.error('または: yarn start -- -p /Volumes/EOS_DIGITAL');
        showHelp();
        process.exit(1);
    }
    
    // パスの存在確認
    if (!fs.existsSync(options.path)) {
        console.error(`Error: 指定されたパスが存在しません: ${options.path}`);
        process.exit(1);
    }
    
    const selectedVolume = options.path;
    console.log(`指定されたパスを使用: ${selectedVolume}`);
    
    console.log(`\n今日のDNGファイルを検索中: ${selectedVolume}`);
    const dngFiles = await findDNGFiles(selectedVolume, true);
    
    if (dngFiles.length === 0) {
        console.log('今日のDNGファイルが見つかりませんでした。');
        process.exit(0);
    }
    
    console.log(`${dngFiles.length} 個の今日のDNGファイルが見つかりました`);
    
    const destinationFolder = createDestinationFolder();
    console.log(`\n保存先フォルダ: ${destinationFolder}`);
    
    const { copiedCount, skippedCount } = await copyFilesDifferential(dngFiles, destinationFolder);
    
    console.log('\n=== 完了 ===');
    console.log(`  コピー済み: ${copiedCount} ファイル`);
    console.log(`  スキップ: ${skippedCount} ファイル (既に存在)`);
    console.log(`  合計: ${dngFiles.length} ファイル`);
};

main().catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
});