export type Options = {
    path: string | null;
    help: boolean;
};

export type CopyResult = {
    copiedCount: number;
    skippedCount: number;
};