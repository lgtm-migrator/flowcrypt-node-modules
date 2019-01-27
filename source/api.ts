
import * as http from 'http';
import { Context } from './context';
import { IncomingMessage, ServerResponse } from 'http';

export class HttpAuthErr extends Error { }
export class HttpClientErr extends Error { }

export type RequestHandler = (parsedReqBody: any, req: IncomingMessage) => Promise<any>;
type Handlers = { [request: string]: RequestHandler };

export class Api {

  public server: http.Server;
  protected apiName: string;
  protected context: Context;
  protected handlers: Handlers;
  protected maxRequestSizeMb = 0;
  protected maxRequestSizeBytes = 0;

  constructor(context: Context, apiName: string, handlers: Handlers) {
    this.handlers = handlers;
    this.apiName = apiName;
    this.context = context;
    this.server = http.createServer((request, response) => {
      this.handleReq(request, response).then((r) => {
        response.end(r);
        try {
          this.log(request, response);
        } catch (e) {
          context.log.exception(e).catch(console.error);
        }
      }).catch((e) => {
        if (e instanceof HttpAuthErr) {
          response.statusCode = 401;
          response.setHeader('WWW-Authenticate', `Basic realm="${this.apiName}"`);
          e.stack = undefined;
        } else if (e instanceof HttpClientErr) {
          response.statusCode = 400;
          e.stack = undefined;
        } else {
          context.log.exception(e, `url:${request.url}`).catch(console.error);
          response.statusCode = 500;
        }
        const formattedErr = this.fmtErr(e);
        response.end(formattedErr);
        try {
          this.log(request, response, formattedErr);
        } catch (e) {
          context.log.exception(e).catch(console.error);
        }
      });
    });
  }

  public listen = (port: number, host = '127.0.0.1', maxMb = 100) => new Promise((resolve, reject) => {
    this.maxRequestSizeMb = maxMb;
    this.maxRequestSizeBytes = maxMb * 1024 * 1024;
    this.server.listen(port, host);
    this.server.on('listening', () => {
      const address = this.server.address();
      const msg = `${this.apiName} listening on ${typeof address === 'object' ? address.port : address}`;
      this.context.log.info(msg);
      resolve();
    })
  });

  public close = (): Promise<void> => new Promise(resolve => this.server.close(resolve));

  protected log = (req: http.IncomingMessage, res: http.ServerResponse, errRes?: Buffer) => undefined as void;

  protected handleReq = async (req: IncomingMessage, res: ServerResponse): Promise<Buffer> => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/' && req.method === 'GET') {
      return this.fmtRes({ app_name: this.apiName });
    }
    if (req.url === '/alive' && req.method === 'GET') {
      return this.fmtRes({ alive: true });
    }
    if (req.url === '/health' && req.method === 'GET') {
      if (!this.context.db) {
        return this.fmtRes({ error: { message: 'no db configured' } });
      }
      const start = Date.now();
      try {
        return this.fmtRes(await this.context.db.read(async query => {
          let [{ result }] = await query('SELECT 1+2 AS result;');
          let health = Number(result) === 3 ? 'ok' : 'error';
          return { health, db: { ms: (Date.now() - start) } };
        }));
      } catch (e) {
        res.statusCode = 500;
        return this.fmtRes({ health: 'down', error: String(e), db: { ms: (Date.now() - start) } });
      }
    }
    const handler = this.chooseHandler(req);
    if (handler) {
      return this.fmtHandlerRes(await handler(this.parseReqBody(await this.collectReq(req)), req));
    }
    throw new HttpClientErr(`unknown path ${req.url}`);
  }

  protected chooseHandler = (req: IncomingMessage): RequestHandler => {
    return this.handlers[(req.url || '').replace('/', '')];
  }

  protected fmtErr = (e: any): Buffer => {
    return Buffer.from(JSON.stringify({
      error: {
        message: String(e),
        stack: e && typeof e === 'object' ? e.stack || '' : ''
      }
    }));
  }

  protected fmtHandlerRes = (respnse: any): any => {
    return this.fmtRes(respnse);
  }

  protected fmtRes = (response: {}): Buffer => {
    return Buffer.from(JSON.stringify(response));
  }

  protected collectReq = (req: IncomingMessage): Promise<Buffer> => new Promise((resolve, reject) => {
    const body: Buffer[] = [];
    let byteLength = 0;
    req.on('data', (chunk: Buffer) => {
      byteLength += chunk.length;
      if (this.maxRequestSizeBytes && byteLength > this.maxRequestSizeBytes) {
        reject(new HttpClientErr(`Message over ${this.maxRequestSizeMb} MB`))
      } else {
        body.push(chunk);
      }
    });
    req.on('end', () => {
      try {
        resolve(Buffer.concat(body));
      } catch (e) {
        reject(e);
      }
    });
  })

  protected parseReqBody = (body: Buffer): any => {
    return JSON.parse(body.toString());
  }

}



