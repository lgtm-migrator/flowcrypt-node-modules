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
    request.get(options, (error, response, body) => {
      if (error) {
        reject(new RequestsError(error));
      } else {
        resolve(response);
      }
    });
  });

  public static post = (options: PossibleRequestOptions): Promise<request.Response> => new Promise((resolve, reject) => {
    request.post(options, (error, response, body) => {
      if (error) {
        reject(new RequestsError(error));
      } else {
        resolve(response);
      }
    });
  });

}
