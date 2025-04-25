import { Injectable } from '@angular/core';
import { Observable, from, of, switchMap } from 'rxjs';
import {
  UserMenus,
  AdminMenus,
  SuperadminMenus,
} from '../../src/data/menu/menu';
import { RoleClient } from '../api/api-client.service';
import { AuthService } from '../Auth/auth.service';
import { Navigation } from '../../src/data/menu/Navigation';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(private authService: AuthService) {}

  getMenu(): Observable<Navigation[]> {
    return from(this.authService.getUserRole()).pipe(
      switchMap((roleName) => {
        let menus: Navigation[] = [];
        switch (roleName) {
          case 'superadmin':
            menus = SuperadminMenus;
            break;
          case 'admin':
            menus = AdminMenus;
            break;
          case 'user':
            menus = UserMenus;
            break;
          default:
            menus = UserMenus;
        }

        return of(menus);
      })
    );
  }
}
