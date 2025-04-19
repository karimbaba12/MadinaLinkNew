import { Component, OnInit } from '@angular/core';
import { UsersClient } from '../../../Services/api/api-client.service';
import { CrudTableConfig } from '../../data/menu/reusableCrudData';
import { ReusableCrudComponent } from '../reusable-crud/reusable-crud.component';
import { MatIcon } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { AddComponent } from '../../dialogs/add/add.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { UpdateComponent } from '../../dialogs/update/update.component';
import { AuthService } from '../../../Services/Auth/auth.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  UserDto,
  UserDtoUpdate,
} from '../../../Services/api/api-client.service';
import { DeleteComponent } from '../../dialogs/delete/delete.component';
import { of } from 'rxjs';

interface TableUser {
  username: string;
  phoneNumber: string;
  email: string;
  roleName: string;
  status: string;
  rawData: UserDto;
}

@Component({
  selector: 'app-usermanagement',
  imports: [ReusableCrudComponent, MatIcon, MatInputModule, MatProgressSpinner],
  templateUrl: './usermanagement.component.html',
  styleUrls: ['./usermanagement.component.scss'],
})
export class UsermanagementComponent implements OnInit {
  // Pagination and sorting
  sortField = 'username';
  sortDirection = 'asc';
  pageSize = 10;
  pageIndex = 0;

  // State management
  loading = false;
  isDeleting = false;
  tableData: TableUser[] = [];
  currentUserRoleId: number | null = null;

  // Table configuration
  config: CrudTableConfig<TableUser> = {
    title: 'User Management',
    columns: [
      { name: 'username', header: 'Username', sortable: true },
      { name: 'phoneNumber', header: 'Phone Number', sortable: true },
      { name: 'email', header: 'Email', sortable: true },
      { name: 'roleName', header: 'Role', sortable: true },
      {
        name: 'status',
        header: 'Status',
        sortable: true,
        formatter: (value: boolean) => (value ? 'Active' : 'Inactive'),
      },
    ],
    dataSource: this.tableData,
  };

  constructor(
    private usersClient: UsersClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.currentUserRoleId = this.authService.getUserRoleId();
    await this.loadUsers();
  }
  async searchUsers(term: string) {
    if (term.length >= 3 || term.length === 0) {
      await this.loadUsers();
    }
    return of(null); // Return observable for the pipe
  }
  async loadUsers(): Promise<void> {
    this.loading = true;
    try {
      const response = await this.usersClient.getAll().toPromise();

      if (!response?.data) {
        this.handleEmptyData();
        return;
      }

      this.tableData = response.data.map((user) => this.mapToTableUser(user));
      this.config.dataSource = [...this.tableData];
    } catch (err) {
      this.handleLoadError(err);
    } finally {
      this.loading = false;
    }
  }

  private mapToTableUser(user: UserDto): TableUser {
    return {
      username: user.username || 'N/A',
      phoneNumber: user.phoneNumber?.toString() || 'N/A',
      email: user.email || 'N/A',
      roleName: this.getRoleName(user.roleId ?? 0),
      status: user.isActive ? 'Active' : 'Inactive',
      rawData: user,
    };
  }

  private getRoleName(roleId: number): string {
    const roles: Record<number, string> = {
      1: 'User',
      2: 'Admin',
      3: 'Super Admin',
      4: 'Client',
    };
    return roles[roleId] || 'Unknown';
  }

  private handleEmptyData(): void {
    this.tableData = [];
    this.config.dataSource = [];
    this.snackBar.open('No user data available', 'Close', { duration: 3000 });
  }

  private handleLoadError(err: any): void {
    console.error('Failed to load users:', err);
    this.snackBar.open(
      'Failed to load users. Please try again later.',
      'Close',
      { duration: 3000 }
    );
  }

  onEdit(item: TableUser): void {
    const dialogRef = this.dialog.open(UpdateComponent, {
      width: '800px',
      disableClose: true,
      data: { user: item.rawData },
    });

    dialogRef.afterClosed().subscribe((result: UserDtoUpdate) => {
      if (result) {
        this.updateUser(result);
      }
    });
  }

  private updateUser(updatedUser: UserDtoUpdate): void {
    this.loading = true;
    this.usersClient.updateUser(updatedUser).subscribe({
      next: () => {
        this.snackBar.open('User updated successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.loadUsers();
      },
      error: (err) => {
        this.loading = false;
        this.showError('update', err);
      },
    });
  }

  onDelete(item: TableUser): void {
    const dialogRef = this.dialog.open(DeleteComponent, {
      width: '450px',
      disableClose: true,
      data: {
        userId: item.rawData.userId,
        username: item.username,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        if (item.rawData.userId !== undefined) {
          this.deleteUser(item.rawData.userId);
        } else {
          console.error('User ID is undefined');
        }
      }
    });
  }

  private deleteUser(userId: number): void {
    this.isDeleting = true;
    this.usersClient.deleteById(userId).subscribe({
      next: () => {
        this.snackBar.open('User deleted successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.loadUsers();
      },
      error: (err) => {
        this.isDeleting = false;
        this.showError('delete', err);
      },
      complete: () => (this.isDeleting = false),
    });
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(AddComponent, {
      width: '800px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: UserDto) => {
      if (result) {
        this.createUser(result);
      }
    });
  }

  private createUser(newUser: UserDto): void {
    this.loading = true;
    this.usersClient.add(newUser).subscribe({
      next: () => {
        this.snackBar.open('User created successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.loadUsers();
      },
      error: (err) => {
        this.loading = false;
        this.showError('create', err);
      },
    });
  }

  private showError(action: string, err: any): void {
    const errorMessage =
      err.error?.message || err.message || 'Unknown error occurred';
    this.snackBar.open(`Failed to ${action} user: ${errorMessage}`, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    console.error(`Error ${action} user:`, err);
  }

  onRefresh(): void {
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadUsers();
  }

  onSortChange(sort: Sort): void {
    this.sortField = sort.active;
    this.sortDirection = sort.direction;
    this.loadUsers();
  }

  canAddUsers(): boolean {
    return this.authService.isAdmin() || this.authService.isSuperAdmin();
  }
}
