import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { AUTH_GATEWAY } from './ports/auth.gateway';
import { AuthSessionService } from './auth-session.service';
import { AuthResponse, AuthTokens, LoginRequest } from '../domain/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AUTH_GATEWAY);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private refreshRequest?: Observable<AuthTokens>;

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.api.login(request).pipe(
      tap((response) => this.session.create(response)),
    );
  }

  refreshSession(): Observable<AuthTokens> {
    if (this.refreshRequest) {
      return this.refreshRequest;
    }

    const refreshToken = this.session.refreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No existe una sesión renovable'));
    }

    this.refreshRequest = this.api.refresh(refreshToken).pipe(
      tap((tokens) => this.session.updateTokens(tokens)),
      finalize(() => {
        this.refreshRequest = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.refreshRequest;
  }

  logout(): Observable<void> {
    const refreshToken = this.session.refreshToken();
    const request = refreshToken
      ? this.api.logout(refreshToken).pipe(catchError(() => of(null)))
      : of(null);

    return request.pipe(
      tap(() => {
        this.session.clear();
        void this.router.navigate(['/auth/login']);
      }),
      map(() => undefined),
    );
  }

  clearSession(): void {
    this.session.clear();
    void this.router.navigate(['/auth/login']);
  }
}
