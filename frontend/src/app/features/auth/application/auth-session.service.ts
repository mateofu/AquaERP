import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthResponse, AuthTokens, Role } from '../domain/auth.models';
import { AUTH_STORAGE } from './ports/auth-storage.port';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly storage = inject(AUTH_STORAGE);
  private readonly state = signal(this.storage.read());

  readonly user = computed(() => this.state().user);
  readonly accessToken = computed(() => this.state().accessToken);
  readonly refreshToken = computed(() => this.state().refreshToken);
  readonly isAuthenticated = computed(
    () => Boolean(this.state().user && this.state().accessToken),
  );
  readonly displayName = computed(() => {
    const user = this.state().user;
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  create(response: AuthResponse): void {
    const nextState = {
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };
    this.state.set(nextState);
    this.storage.write(response.user, response);
  }

  updateTokens(tokens: AuthTokens): void {
    const current = this.state();

    if (!current.user) {
      return;
    }

    this.state.set({ ...current, ...tokens });
    this.storage.write(current.user, tokens);
  }

  hasAnyRole(roles: readonly Role[]): boolean {
    const userRoles = this.state().user?.roles ?? [];
    return roles.some((role) => userRoles.includes(role));
  }

  clear(): void {
    this.state.set({
      user: null,
      accessToken: null,
      refreshToken: null,
    });
    this.storage.clear();
  }
}
