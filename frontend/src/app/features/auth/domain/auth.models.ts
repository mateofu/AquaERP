export type Role =
  | 'ADMIN'
  | 'OPERADOR'
  | 'CAJERO'
  | 'LECTOR'
  | 'CONSULTA';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}
