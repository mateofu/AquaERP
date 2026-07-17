import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthResponse,
  AuthTokens,
  LoginRequest,
} from '../../domain/auth.models';

export interface AuthGateway {
  login(request: LoginRequest): Observable<AuthResponse>;
  refresh(refreshToken: string): Observable<AuthTokens>;
  logout(refreshToken: string): Observable<{ message: string }>;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY');
