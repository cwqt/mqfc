import { HTTP } from './http';
import { Request, Response, NextFunction } from 'express';
import log from './logger';

export interface IErrorResponse {
  status: 'fail' | 'error'; // fail = internal server error
  statusCode: HTTP;
  message: string;
}

export const handleError = (req: Request, res: Response, next: NextFunction, err: ErrorHandler | Error) => {
  const errorType: HTTP = err instanceof ErrorHandler ? err.errorType : HTTP.ServerError;
  const message: string = err.message;

  const response: IErrorResponse = {
    status: `${errorType}`.startsWith('4') ? 'fail' : 'error',
    statusCode: errorType || 520,
    message: message,
  };

  log.error(`(${errorType}) --> ${JSON.stringify(err.message)}`);
  if (errorType !== HTTP.NotFound) console.log(err.stack);

  res.status(response.statusCode).json(response);
};

export class ErrorHandler extends Error {
  errorType: HTTP;

  constructor(statusCode: HTTP, message?: string) {
    super();
    this.errorType = statusCode;
    this.message = message || "An error occured";
  }
}
