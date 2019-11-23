import { Context, Api, RequestHandler, HttpClientErr, Status, Dict } from '..';
import { IncomingMessage, ServerResponse } from 'http';

type Method = 'GET' | 'PUT' | 'POST' | 'DELETE';
export type RestfulBufferReq = { method: Method; url: string; body: Buffer; query: Dict<string>; }
export type RestfulBufferRes = { status: Status; body?: Buffer; contentType?: 'application/json' | 'text/plain' | 'text/html' }

export class RestfulBufferApi extends Api<RestfulBufferReq, RestfulBufferRes> {

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

  protected chooseHandler = (req: IncomingMessage): RequestHandler<RestfulBufferReq, RestfulBufferRes> | undefined => {
    let { url } = this.splitUrl(this.urlWithoutPrefix(req.url).replace(/^\//, '').replace(/\/$/, ''))
    const handler = this.handlers[url];
    if (handler) { // direct handler name match
      return handler;
    }
    const steps = url.split('/');
    steps.pop();
    return this.handlers[`${steps.join('/')}/?`]
  }

  protected fmtHandlerRes = ({ body, status, contentType }: RestfulBufferRes, serverRes: ServerResponse): Buffer => {
    serverRes.statusCode = status;
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

  protected parseReqBody = (body: Buffer, req: IncomingMessage): RestfulBufferReq => {
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
    return Buffer.from(JSON.stringify({ error: { message: String(e).replace(/^Error: /, '') } }));
  }

}
