import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import type { CopyResult } from './types';

const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

export const createDestinationFolder = (targetDate: Date): string => {
    const desktop = path.join(os.homedir(), 'Desktop');
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const folderName = `${year}${month}${day}`;
    
    const destinationPath = path.join(desktop, folderName);
    
    if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath, { recursive: true });
    }
    
    return destinationPath;
};

type CopyAction = 'skip' | 'copy' | 'overwrite';

const shouldSkipFile = async (sourceFile: string, destinationFile: string): Promise<boolean> => {
    if (!fs.existsSync(destinationFile)) {
        return false;
    }
    
    const [sourceStats, destStats] = await Promise.all([
        stat(sourceFile),
        stat(destinationFile)
    ]);
    
    return sourceStats.size === destStats.size;
};

const actionLoggers: Record<CopyAction, (sourceFile: string, destinationFile: string) => Promise<void>> = {
    skip: async (sourceFile: string, destinationFile: string) => {
        const filename = path.basename(sourceFile);
        const destStats = await stat(destinationFile);
        console.log(`⏭️  スキップ: ${filename} (既存: ${destStats.size} bytes)`);
    },
    
    overwrite: async (sourceFile: string, destinationFile: string) => {
        const filename = path.basename(sourceFile);
        const [sourceStats, destStats] = await Promise.all([
            stat(sourceFile),
            stat(destinationFile)
        ]);
        console.log(`🔄 上書き: ${filename} (元: ${sourceStats.size} bytes, 既存: ${destStats.size} bytes)`);
    },
    
    copy: async (sourceFile: string, destinationFile: string) => {
        const filename = path.basename(sourceFile);
        console.log(`📋 新規コピー: ${filename}`);
    }
};


export const copyFilesDifferential = async (sourceFiles: string[], destinationFolder: string): Promise<CopyResult> => {
    let copiedCount = 0;
    let skippedCount = 0;
    
    console.log('\n=== 重複チェックとコピー処理 ===');
    console.log('重複判定: ファイル名とファイルサイズで判定します');
    console.log('');
    
    for (const sourceFile of sourceFiles) {
        const filename = path.basename(sourceFile);
        const destinationFile = path.join(destinationFolder, filename);
        
        try {
            const shouldSkip = await shouldSkipFile(sourceFile, destinationFile);
            
            if (shouldSkip) {
                await actionLoggers.skip(sourceFile, destinationFile);
                skippedCount++;
                continue;
            }
            
            const action: CopyAction = fs.existsSync(destinationFile) ? 'overwrite' : 'copy';
            await actionLoggers[action](sourceFile, destinationFile);
            
            await copyFile(sourceFile, destinationFile);
            copiedCount++;
        } catch (error) {
            console.error(`❌ エラー ${filename}:`, (error as Error).message);
        }
    }
    
    return { copiedCount, skippedCount };
};