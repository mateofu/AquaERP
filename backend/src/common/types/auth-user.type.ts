import { RoleName } from '@prisma/client';

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: RoleName[];
}

export interface JwtPayload {
  sub: number;
  email: string;
  roles: RoleName[];
}
