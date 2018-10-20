import { BaseConfig, LOG_LEVELS } from './config';
export declare class Log {
    LOG_FILE: string | null;
    LOG_LEVEL: LOG_LEVELS;
    LOG_PREFIX: {
        error: string;
        warning: string;
        info: string;
        access: string;
        debug: string;
    };
    constructor(config: BaseConfig);
    private static build_prefix;
    static _fatal: (app_name: string, message: string) => void;
    fatal: (app_name: string, message: string) => void;
    exception: (e: Error, details?: string | undefined, exit?: boolean) => Promise<void>;
    error: (message: string, exit?: boolean) => Promise<void>;
    warning: (message: string) => Promise<void>;
    info: (message: string) => Promise<void>;
    access: (message: string) => Promise<void>;
    debug: (message: string) => Promise<void>;
    private static prefix_text;
    private log_to_stdout_and_file;
}
