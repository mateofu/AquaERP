import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../application/auth.service';
import { AuthSessionService } from '../../application/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(AuthSessionService);
  const authService = inject(AuthService);
  const isAuthRequest =
    request.url.endsWith('/auth/login') ||
    request.url.endsWith('/auth/refresh');
  const accessToken = session.accessToken();
  const authorizedRequest =
    accessToken && !isAuthRequest
      ? request.clone({
          setHeaders: { Authorization: `Bearer ${accessToken}` },
        })
      : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isAuthRequest ||
        !session.refreshToken()
      ) {
        return throwError(() => error);
      }

      return authService.refreshSession().pipe(
        switchMap((tokens) =>
          next(
            request.clone({
              setHeaders: {
                Authorization: `Bearer ${tokens.accessToken}`,
              },
            }),
          ),
        ),
        catchError((refreshError: unknown) => {
          authService.clearSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
