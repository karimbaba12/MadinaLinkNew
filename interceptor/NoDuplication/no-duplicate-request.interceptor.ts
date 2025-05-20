import { HttpInterceptorFn } from '@angular/common/http';
import { HttpEvent, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { Observable, shareReplay, finalize } from 'rxjs';

const inFlightRequests = new Map<string, Observable<HttpEvent<unknown>>>();

export const NoDuplicateRequestInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const requestKey = `${req.method} ${req.urlWithParams}`;

  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  const request$ = next(req).pipe(
    shareReplay(1),
    finalize(() => {
      inFlightRequests.delete(requestKey);
    })
  );

  inFlightRequests.set(requestKey, request$);
  return request$;
};
