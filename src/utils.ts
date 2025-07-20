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