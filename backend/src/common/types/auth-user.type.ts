import { RoleName } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: RoleName[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: RoleName[];
}
