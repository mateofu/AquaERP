import { InjectionToken } from '@angular/core';
import {
  AuthState,
  AuthTokens,
  AuthUser,
} from '../../domain/auth.models';

export interface AuthStoragePort {
  read(): AuthState;
  write(user: AuthUser, tokens: AuthTokens): void;
  clear(): void;
}

export const AUTH_STORAGE = new InjectionToken<AuthStoragePort>('AUTH_STORAGE');
