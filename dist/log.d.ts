import { BaseConfig } from './config';
export declare class Log {
    private config;
    private LOG_FILE;
    private LOG_LEVEL;
    private LOG_PREFIX;
    constructor(config: BaseConfig);
    fatal: (message: string) => void;
    exception: (e: Error, details?: string | undefined, exit?: boolean) => Promise<void>;
    error: (message: string, exit?: boolean) => Promise<void>;
    warning: (message: string) => Promise<void>;
    info: (message: string) => Promise<void>;
    access: (message: string) => Promise<void>;
    debug: (message: string) => Promise<void>;
    private static prefix_text;
    private log_to_stdout_and_file;
    private build_prefix;
}
