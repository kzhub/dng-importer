import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export const findDNGFiles = async (volumePath: string, targetDate: Date): Promise<string[]> => {
    const dngFiles: string[] = [];
    const targetDateStart = new Date(targetDate);
    targetDateStart.setHours(0, 0, 0, 0);
    
    const searchDir = async (dir: string): Promise<void> => {
        try {
            const files = await readdir(dir);
            
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = await stat(filePath);
                
                if (stats.isDirectory()) {
                    await searchDir(filePath);
                } else if (file.toLowerCase().endsWith('.dng')) {
                    const fileDate = new Date(stats.mtime);
                    fileDate.setHours(0, 0, 0, 0);
                    if (fileDate.getTime() === targetDateStart.getTime()) {
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