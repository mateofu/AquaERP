import { Request } from 'express';
import { AuthUser } from '../types/auth-user.type';

export interface RequestWithUser extends Request {
  user: AuthUser;
}
