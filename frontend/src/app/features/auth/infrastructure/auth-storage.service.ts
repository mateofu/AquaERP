import { Injectable } from '@angular/core';
import { AuthState, AuthTokens, AuthUser } from '../domain/auth.models';
import { AuthStoragePort } from '../application/ports/auth-storage.port';

const STORAGE_KEY = 'aquaerp.session';

@Injectable({ providedIn: 'root' })
export class AuthStorageService implements AuthStoragePort {
  read(): AuthState {
    const value = sessionStorage.getItem(STORAGE_KEY);

    if (!value) {
      return this.emptyState();
    }

    try {
      const state = JSON.parse(value) as Partial<AuthState>;
      return {
        user: state.user ?? null,
        accessToken: state.accessToken ?? null,
        refreshToken: state.refreshToken ?? null,
      };
    } catch {
      this.clear();
      return this.emptyState();
    }
  }

  write(user: AuthUser, tokens: AuthTokens): void {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user, ...tokens } satisfies AuthState),
    );
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private emptyState(): AuthState {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
    };
  }
}
