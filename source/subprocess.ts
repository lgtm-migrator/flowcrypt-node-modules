import * as child_process from 'child_process';
import * as setNodeCleanupCb from 'node-cleanup';

export interface ChildProcess extends child_process.ChildProcess {
  exitCode?: number;
}

const PROCESSES: ChildProcess[] = [];
const SPAWN_READINESS_TIMEOUT = 10 * 1000;

export class SubprocessError extends Error {
  command: (string | number)[];
  constructor(message: string, command: (string | number)[]) {
    super(message);
    this.command = command;
  }
}

export class ProcessNotReady extends SubprocessError { }

export class Subprocess {

  /**
   * user to replace this with a callback
   */
  public static onStdout = (r: { stdout: Buffer, cmd: string, args: string[] }): void => undefined;

  /**
   * user to replace this with a callback
   */
  public static onStderr = (r: { stderr: Buffer, cmd: string, args: string[] }): void => undefined;

  public static spawn = (cmd: string, rawArgs: (string | number)[], readiness_indicator?: string): Promise<ChildProcess> => new Promise((resolve, reject) => {
    const ready = false;
    const args = rawArgs.map(String);
    let p: ChildProcess = child_process.spawn(cmd, args);
    PROCESSES.push(p);
    p.stdout.on('data', stdout => {
      Subprocess.onStdout({ cmd, args, stdout: stdout });
      if (readiness_indicator && !ready && stdout.indexOf(readiness_indicator) !== -1) {
        resolve(p);
      }
    });
    p.stderr.on('data', stderr => {
      Subprocess.onStderr({ cmd, args, stderr: stderr });
      if (readiness_indicator && !ready && stderr.indexOf(readiness_indicator) !== -1) {
        resolve(p);
      }
    });
    p.on('exit', (code) => {
      p.exitCode = code === null ? -1 : code;
    });
    if (readiness_indicator) {
      setTimeout(() => {
        reject(new ProcessNotReady(`Process did not become ready in ${SPAWN_READINESS_TIMEOUT} by outputting <${readiness_indicator}>`, [cmd].concat(rawArgs as string[])));
        p.kill();
      }, SPAWN_READINESS_TIMEOUT);
    } else {
      resolve(p);
    }
  });

  public static exec = (shellCmd: string): Promise<{ stdout: string, stderr: string }> => new Promise((resolve, reject) => {
    let p: child_process.ChildProcess = child_process.exec(shellCmd, (err, stdout, stderr) => err ? reject(err) : resolve({ stdout, stderr }));
    PROCESSES.push(p);
  });

  public static killall = (signal: 'SIGINT' | 'SIGKILL' | 'SIGTERM' = 'SIGTERM') => {
    for (let p of PROCESSES) {
      if (!p.killed) {
        p.kill(signal);
      }
    }
  };

}

setNodeCleanupCb((exit_code, signal) => {
  Subprocess.killall('SIGTERM');
  return undefined;
});
