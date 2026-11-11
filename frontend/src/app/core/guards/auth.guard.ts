import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  
  if (user !== undefined) {
    if (user) {
      return true;
    }
    return router.createUrlTree(['/login']);
  }

  // State is unknown, fetch from backend
  return authService.me().pipe(
    map(u => {
      if (u) return true;
      return router.createUrlTree(['/login']);
    })
  );
};
