#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

// コマンドライン引数の解析
const parseArgs = () => {
    const args = process.argv.slice(2);
    const options = {
        path: null,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-p' || args[i] === '--path') {
            options.path = args[i + 1];
            i++;
        } else if (args[i] === '-h' || args[i] === '--help') {
            options.help = true;
        }
    }
    
    return options;
};

// ヘルプメッセージの表示
const showHelp = () => {
    console.log(`
Usage: node copy_dng_from_sd.js [options]

Options:
  -p, --path <path>  Specify SD card path directly
  -h, --help         Show this help message

Example:
  node copy_dng_from_sd.js -p /Volumes/EOS_DIGITAL
`);
};

// SDカードの検索
const findSDCard = async () => {
    const volumes = [];
    
    if (process.platform === 'darwin') {
        const volumesPath = '/Volumes';
        try {
            const dirs = await readdir(volumesPath);
            for (const dir of dirs) {
                const volumePath = path.join(volumesPath, dir);
                const stats = await stat(volumePath);
                if (stats.isDirectory()) {
                    volumes.push(volumePath);
                }
            }
        } catch (error) {
            console.error('Error reading volumes:', error);
        }
    }
    
    return volumes;
};

// DNGファイルの検索
const findDNGFiles = async (volumePath, todayOnly = true) => {
    const dngFiles = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const searchDir = async (dir) => {
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

// 保存先フォルダの作成
const createDestinationFolder = () => {
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

// 差分コピー処理
const copyFilesDifferential = async (sourceFiles, destinationFolder) => {
    let copiedCount = 0;
    let skippedCount = 0;
    
    console.log('\n=== 重複チェックとコピー処理 ===');
    console.log('重複判定: ファイル名とファイルサイズで判定します');
    console.log('');
    
    for (const sourceFile of sourceFiles) {
        const filename = path.basename(sourceFile);
        const destinationFile = path.join(destinationFolder, filename);
        
        try {
            // ファイルが既に存在するかチェック
            if (fs.existsSync(destinationFile)) {
                const sourceStats = await stat(sourceFile);
                const destStats = await stat(destinationFile);
                
                // ファイルサイズが同じ場合は同一ファイルとみなしてスキップ
                if (sourceStats.size === destStats.size) {
                    console.log(`⏭️  スキップ: ${filename} (既存: ${destStats.size} bytes)`);
                    skippedCount++;
                    continue;
                } else {
                    // サイズが異なる場合は上書きコピー
                    console.log(`🔄 上書き: ${filename} (元: ${sourceStats.size} bytes, 既存: ${destStats.size} bytes)`);
                }
            } else {
                console.log(`📋 新規コピー: ${filename}`);
            }
            
            await copyFile(sourceFile, destinationFile);
            copiedCount++;
        } catch (error) {
            console.error(`❌ エラー ${filename}:`, error.message);
        }
    }
    
    return { copiedCount, skippedCount };
};

// ユーザー入力を待つ
const getUserInput = (question) => {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        readline.question(question, (answer) => {
            readline.close();
            resolve(answer);
        });
    });
};

// メイン処理
const main = async () => {
    const options = parseArgs();
    
    if (options.help) {
        showHelp();
        process.exit(0);
    }
    
    let selectedVolume;
    
    // パスが指定されている場合
    if (options.path) {
        if (!fs.existsSync(options.path)) {
            console.error(`Error: 指定されたパスが存在しません: ${options.path}`);
            process.exit(1);
        }
        selectedVolume = options.path;
        console.log(`指定されたパスを使用: ${selectedVolume}`);
    } else {
        // パスが指定されていない場合は自動検索
        console.log('SDカードを検索中...');
        const volumes = await findSDCard();
        
        if (volumes.length === 0) {
            console.log('SDカードが見つかりません。SDカードを挿入して再度実行してください。');
            console.log('または -p オプションでパスを直接指定してください。');
            process.exit(1);
        }
        
        console.log(`${volumes.length} 個のボリュームが見つかりました:`);
        volumes.forEach((volume, index) => {
            console.log(`  ${index + 1}. ${volume}`);
        });
        
        selectedVolume = volumes[0];
        if (volumes.length > 1) {
            const answer = await getUserInput('ボリューム番号を選択 (デフォルト: 1): ');
            const choice = parseInt(answer) || 1;
            if (choice > 0 && choice <= volumes.length) {
                selectedVolume = volumes[choice - 1];
            }
        }
    }
    
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

// エラーハンドリング付きで実行
main().catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
});