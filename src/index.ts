#!/usr/bin/env node

import * as fs from 'fs';
import { parseArgs, showHelp } from './cli';
import { findDNGFiles } from './fileSearch';
import { createDestinationFolder, copyFilesDifferential } from './fileOperations';

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

if (require.main === module) {
    main().catch((error) => {
        console.error('エラー:', error);
        process.exit(1);
    });
}