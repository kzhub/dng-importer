#!/usr/bin/env node

import * as fs from 'fs';
import { parseArgs, showHelp } from './cli';
import { parseDate } from './utils';
import type { Options } from './types';
import { findDNGFiles } from './fileSearch';
import { createDestinationFolder, copyFilesDifferential } from './fileOperations';

const validateOptions = (options: Options): void => {
    if (!options.path) {
        console.error('Error: SDカードのパスを指定してください。');
        console.error('使用方法: yarn start /Volumes/EOS_DIGITAL');
        console.error('または: yarn start -- -p /Volumes/EOS_DIGITAL');
        showHelp();
        process.exit(1);
    }
    
    if (!fs.existsSync(options.path)) {
        console.error(`Error: 指定されたパスが存在しません: ${options.path}`);
        process.exit(1);
    }
};

const logProcessInfo = (path: string, targetDate: Date, dateOption?: string | null): void => {
    console.log(`指定されたパスを使用: ${path}`);
    if (dateOption) {
        console.log(`対象日付: ${dateOption}`);
    } else {
        console.log(`対象日付: 今日 (${targetDate.toISOString().split('T')[0]})`);
    }
};

const logResults = (copiedCount: number, skippedCount: number, totalFiles: number): void => {
    console.log('\n=== 完了 ===');
    console.log(`  コピー済み: ${copiedCount} ファイル`);
    console.log(`  スキップ: ${skippedCount} ファイル (既に存在)`);
    console.log(`  合計: ${totalFiles} ファイル`);
};

const processFiles = async (path: string, targetDate: Date): Promise<void> => {
    console.log(`\n指定日のDNGファイルを検索中: ${path}`);
    const dngFiles = await findDNGFiles(path, targetDate);
    
    if (dngFiles.length === 0) {
        console.log('指定日のDNGファイルが見つかりませんでした。');
        return;
    }
    
    console.log(`${dngFiles.length} 個の指定日のDNGファイルが見つかりました`);
    
    const destinationFolder = createDestinationFolder(targetDate);
    console.log(`\n保存先フォルダ: ${destinationFolder}`);
    
    const { copiedCount, skippedCount } = await copyFilesDifferential(dngFiles, destinationFolder);
    logResults(copiedCount, skippedCount, dngFiles.length);
};

const main = async (): Promise<void> => {
    const options = parseArgs();
    
    if (options.help) {
        showHelp();
        process.exit(0);
    }
    
    validateOptions(options);
    
    const targetDate = parseDate(options.date);
    logProcessInfo(options.path!, targetDate, options.date);
    
    await processFiles(options.path!, targetDate);
};

if (require.main === module) {
    main().catch((error) => {
        console.error('エラー:', error);
        process.exit(1);
    });
}