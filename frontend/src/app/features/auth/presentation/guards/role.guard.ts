import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../../application/auth-session.service';
import { Role } from '../../domain/auth.models';

export const roleGuard: CanActivateFn = (route) => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  const roles = (route.data['roles'] as Role[] | undefined) ?? [];

  return roles.length === 0 || session.hasAnyRole(roles)
    ? true
    : router.createUrlTree(['/dashboard']);
};
