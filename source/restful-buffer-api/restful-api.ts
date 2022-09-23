import { Context, Api, RequestHandler, HttpClientErr, Status, Dict } from '..';
import { IncomingMessage, ServerResponse } from 'http';
import { RestfulHandler } from './restful-handler'

type Method = 'GET' | 'PUT' | 'POST' | 'DELETE';
export type RestfulReq = { method: Method; url: string; body: Buffer; query: Dict<string>; }
export type ContentType = 'application/json' | 'text/plain' | 'text/html' | 'text/css' | 'text/javascript' | 'image/png' | 'image/jpeg' | 'text/svg' | 'application/octet-stream';
export type RestfulRes = { status: Status; body?: Buffer; contentType?: ContentType, headers?: Dict<string> }


export class RestfulApi extends Api<RestfulReq, RestfulRes> {

  private static wildcardHandlerPaths: string[] = [];

  public static define(context: Context, apiName: string, handlers: Dict<RestfulHandler>, urlPrefix = ''): RestfulApi {
    const handlerFunctions: { [path: string]: RequestHandler<RestfulReq, RestfulRes> } = {};
    for (const path of Object.keys(handlers)) {
      if (path.endsWith('/*')) {
        RestfulApi.wildcardHandlerPaths.push(path.replace(/\*$/, ''));
      }
      const handlerClass = handlers[path];
      handlerFunctions[path] = async ({ method, query, body, url }, req, res): Promise<RestfulRes> => {
        if (method === 'POST') {
          return await handlerClass.post({ method, query, body, url }, req, res);
        } else if (method === 'DELETE') {
          return await handlerClass.delete({ method, query, body, url }, req, res);
        } else if (method === 'PUT') {
          return await handlerClass.put({ method, query, body, url }, req, res);
        } else {
          return await handlerClass.get({ method, query, body, url }, req, res);
        }
      }
    }
    return new RestfulApi(context, apiName, handlerFunctions, urlPrefix);
  }

  private urlWithoutPrefix = (rawUrl: string | undefined) => {
    if (!rawUrl) {
      return '';
    }
    if (this.urlPrefix && rawUrl.indexOf(this.urlPrefix) === 0) {
      return rawUrl.replace(this.urlPrefix, '');
    }
    return rawUrl;
  }

  private splitUrl = (normalizedUrl: string): { url: string, queryStr?: string } => {
    var questionMarkIndex = normalizedUrl.indexOf('?');
    if (questionMarkIndex > 0) {
      return { url: normalizedUrl.slice(0, questionMarkIndex), queryStr: normalizedUrl.slice(questionMarkIndex + 1) }
    }
    return { url: normalizedUrl };
  }

  protected chooseHandler = (req: IncomingMessage): RequestHandler<RestfulReq, RestfulRes> | undefined => {
    let { url } = this.splitUrl(this.urlWithoutPrefix(req.url).replace(/^\//, '').replace(/\/$/, ''))
    const handler = this.handlers[url];
    if (handler) { // direct handler name match
      return handler;
    }
    const steps = url.split('/');
    steps.pop();
    const placeholderHandler = this.handlers[`${steps.join('/')}/?`];
    if (placeholderHandler) {
      return placeholderHandler;
    }
    const wildcardHandlerPath = RestfulApi.wildcardHandlerPaths.find(path => url.startsWith(path));
    if (wildcardHandlerPath) {
      return this.handlers[`${wildcardHandlerPath}*`];
    }
    return undefined;
  }

  protected fmtHandlerRes = ({ body, status, contentType, headers }: RestfulRes, serverRes: ServerResponse): Buffer => {
    serverRes.statusCode = status;
    serverRes.setHeader('X-Content-Type-Options', 'no-sniff');
    serverRes.setHeader('X-Frame-Options', 'DENY');
    if (contentType) {
      serverRes.setHeader('content-type', contentType);
    } else if (body) {
      if (body[0] === 60 && body[body.length - 1] === 62) { // start with <, end with >
        serverRes.setHeader('content-type', 'text/html');
      } else if (body[0] === 123 && body[body.length - 1] === 125 && body.indexOf(10) === -1) { // start with {, end with }, no newline
        serverRes.setHeader('content-type', 'application/json');
      } else {
        serverRes.setHeader('content-type', 'text/plain');
      }
    }
    if (headers) {
      for (const headerName of Object.keys(headers)) {
        serverRes.setHeader(headerName, headers[headerName]);
      }
    }
    return body || Buffer.from([]);
  }

  private parseUrlQuery = (queryStr: string) => {
    const valuePairs = queryStr.split('&');
    const params: Dict<string> = {};
    for (const valuePair of valuePairs) {
      if (valuePair) {
        const equalSignSeparatedParts = valuePair.split('=');
        params[equalSignSeparatedParts.shift()!] = decodeURIComponent(equalSignSeparatedParts.join('='));
      }
    }
    return params;
  }

  protected parseReqBody = (body: Buffer, req: IncomingMessage): RestfulReq => {
    if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'PUT' && req.method !== 'DELETE') {
      throw new HttpClientErr(`Method not supported: ${req.method}`);
    }
    const method = req.method as Method;
    const fullUrl = req.url;
    if (!fullUrl) {
      throw new HttpClientErr(`Url not supported: ${fullUrl}`);
    }
    const { url, queryStr } = this.splitUrl(this.urlWithoutPrefix(fullUrl));
    const query = this.parseUrlQuery(queryStr || '');
    return { method, body, url, query };
  }

  protected fmtErr = (e: any): Buffer => {
    const errMsg = String(e).replace(/^Error: /, '').replace(/unknown path .*/, 'unknown path');
    return Buffer.from(JSON.stringify({ error: { message: errMsg } }));
  }

}
