import * as request from 'request';

type PossibleRequestOptions = (request.UriOptions & request.CoreOptions) | (request.UrlOptions & request.CoreOptions);

export class RequestsError extends Error {
  public reason: any;
  constructor(reason: any) {
    super();
    this.reason = reason;
  }
}

export class Requests {

  public static get = (options: PossibleRequestOptions): Promise<request.Response> => new Promise((resolve, reject) => {
    request.get(options, (e, resp, body) => e ? reject(new RequestsError(e)) : resolve(resp));
  });

  public static post = (options: PossibleRequestOptions): Promise<request.Response> => new Promise((resolve, reject) => {
    request.post(options, (e, resp, body) => e ? reject(new RequestsError(e)) : resolve(resp));
  });

  public static put = (options: PossibleRequestOptions): Promise<request.Response> => new Promise((resolve, reject) => {
    request.put(options, (e, resp, body) => e ? reject(new RequestsError(e)) : resolve(resp));
  });

  public static del = (options: PossibleRequestOptions): Promise<request.Response> => new Promise((resolve, reject) => {
    request.del(options, (e, resp, body) => e ? reject(new RequestsError(e)) : resolve(resp));
  });

}
