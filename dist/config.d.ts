export declare enum LOG_LEVELS {
    error = 0,
    warning = 1,
    info = 2,
    access = 3,
    debug = 4
}
export declare type CommandLineOptions = {
    [name: string]: string;
};
export declare class BaseConfig {
    APP_NAME: string;
    LOG_LEVEL: LOG_LEVELS;
    LOG_DIRECTORY: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_CERTS_PATH: string;
    DB_INSECURE: boolean;
    private log;
    private static KEYS_CONFIGURABLE;
    constructor(app_name: string, cmd_line_options: CommandLineOptions);
    static is_configurable: (option_name: string) => boolean;
    static list_configurable: (cmd_line?: boolean) => string[];
    static get_api_port: (cmd_line_port: string | undefined) => number;
    private exit_if_missing_file;
    validate: () => Promise<void>;
    private static cmd_line_format;
    private static env_var_format;
    private remove_trailing_slash;
    private set_option;
}
