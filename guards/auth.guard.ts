import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../Services/Auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Promise<boolean> {
    return this.authService
      .getUserRole()
      .then((roleName) => {
        console.log('User Role AuthGuard:', roleName);
        if (
          roleName === 'admin' ||
          roleName === 'superadmin' ||
          roleName === 'user'
        ) {
          return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      })
      .catch(() => {
        this.router.navigate(['/login']);
        return false;
      });
  }
}
