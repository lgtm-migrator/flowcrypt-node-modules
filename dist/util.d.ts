/// <reference types="node" />
export declare let read_file: (path: string) => Promise<Buffer>;
export declare let move_file: (from: string, to: string) => Promise<Buffer>;
export declare let write_file: (path: string) => Promise<Buffer>;
export declare let append_file: (path: string, text: string) => Promise<void>;
export declare let delete_file: (path: string) => Promise<Buffer>;
export declare let read_dir: (path: string) => Promise<string[]>;
export declare let mk_dir: (path: string) => Promise<void>;
export declare let str_to_hex: (s: string) => string;
export declare let uint8_to_str: (u8a: Uint8Array) => string;
export declare let keyid_bytes_to_hex: (bytes: string) => string;
export declare let wait: (ms: number) => Promise<{}>;
export declare let chunks: <T>(array: T[], size: number) => T[][];
export declare let random: (length?: number) => string;
