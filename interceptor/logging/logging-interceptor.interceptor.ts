import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const token = localStorage.getItem('auth_token');
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  console.log('Outgoing request:', {
    url: authReq.url,
    method: authReq.method,
    headers: authReq.headers,
    body: authReq.body,
  });

  return next(authReq).pipe(
    tap({
      error: async (error: HttpErrorResponse) => {
        let errorDetails = 'Unknown error';

        if (error.error instanceof Blob) {
          try {
            const errorText = await error.error.text();
            const parsedError = JSON.parse(errorText);
            errorDetails = parsedError.title || parsedError.detail || errorText;
          } catch {
            errorDetails = 'Failed to parse error response';
          }
        } else if (error.error) {
          errorDetails =
            typeof error.error === 'object'
              ? JSON.stringify(error.error)
              : error.error;
        }

        console.error(`Request to ${authReq.url} failed:`, {
          status: error.status,
          statusText: error.statusText,
          error: errorDetails,
          headers: error.headers,
        });
      },
    })
  );
};
