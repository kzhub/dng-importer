export type Options = {
    path: string | null;
    help: boolean;
    date: string | null;  // YYYY-MM-DD形式
};

export type CopyResult = {
    copiedCount: number;
    skippedCount: number;
};