import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');

  let modifiedReq = req;

  if (token) {
    const [, payload] = token.split('.');
    try {
      const decoded = JSON.parse(atob(payload));
      const exp = decoded.exp;

      if (exp && Date.now() >= exp * 1000) {
        localStorage.removeItem('auth_token');
        router.navigate(['/login']);
        return of(); // Cancel the request
      }

      modifiedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      localStorage.removeItem('auth_token');
      router.navigate(['/login']);
      return of(); // Cancel the request
    }
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('auth_token');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
