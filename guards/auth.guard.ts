import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../Services/Auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const roleName = await this.authService.getUserRole();

    console.log('User Role AuthGuard:', roleName);

    if (
      roleName === 'admin' ||
      roleName === 'superadmin' ||
      roleName === 'user'
    ) {
      return true;
    } else {
      this.router.navigate(['/unauthorized']);
      return false;
    }
  }
}
