import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const allowedRoles = route.data?.['roles'] as string[];
  
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const user = authService.currentUser();

  if (user !== undefined) {
    if (user && allowedRoles.includes(user.rol)) {
      return true;
    }
    return user ? router.createUrlTree(['/dashboard']) : router.createUrlTree(['/login']);
  }

  return authService.me().pipe(
    map(u => {
      if (u && allowedRoles.includes(u.rol)) {
        return true;
      }
      return u ? router.createUrlTree(['/dashboard']) : router.createUrlTree(['/login']);
    })
  );
};
