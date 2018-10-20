import { BaseConfig, CommandLineOptions } from './config';
import { Context } from './context';
export declare const new_command: (cmd: string, allow_options: string[], ConfigConstructor: typeof BaseConfig, cb: (context: Context, local_opt: CommandLineOptions, ...args: string[]) => void) => (all_opt: CommandLineOptions, ...args: string[]) => void;
