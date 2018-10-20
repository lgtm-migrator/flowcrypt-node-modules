import { Config, LOG_LEVELS } from './config';
export declare class Log {
    LOG_FILE: string | null;
    LOG_LEVEL: LOG_LEVELS;
    constructor(config: Config);
    static _fatal: (message: string) => void;
    fatal: (message: string) => void;
    exception: (e: Error, details?: string | undefined, exit?: boolean) => Promise<void>;
    error: (message: string, exit?: boolean) => Promise<void>;
    warning: (message: string) => Promise<void>;
    info: (message: string) => Promise<void>;
    access: (message: string) => Promise<void>;
    debug: (message: string) => Promise<void>;
    private static prefix_text;
    private log_to_stdout_and_file;
}
