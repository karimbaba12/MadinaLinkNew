// role.service.ts
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RoleClient } from '../api/api-client.service';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private roles: any[] = [];

  constructor(private rolesClient: RoleClient) {}

  async loadRoles(): Promise<void> {
    try {
      const response = await firstValueFrom(this.rolesClient.getAll());
      this.roles = response.data || [];
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  }

  getAvailableRoles(currentUserRoleId: number): any[] {
    if (currentUserRoleId === 3) {
      return this.roles.filter((r) => r.roleId !== 1); // Can assign admin, superadmin, client
    }
    if (currentUserRoleId === 2) {
      return this.roles.filter((r) => r.roleId === 1 || r.roleId === 4); // Can assign user, client
    }
    return []; 
  }
}
