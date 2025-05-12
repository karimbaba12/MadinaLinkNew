import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  Subject,
  takeUntil,
} from 'rxjs';

import {
  TenantServiceClient,
  TenantServiceDto,
  UsersClient,
  UserDto,
} from '../../../Services/api/api-client.service';
import { CrudTableConfig } from '../../data/menu/reusableCrudData';
import { ReusableCrudComponent } from '../reusable-crud/reusable-crud.component';
import { AuthService } from '../../../Services/Auth/auth.service';
import { AddComponent } from '../../dialogs/add/add.component';
import { UpdateComponent } from '../../dialogs/update/update.component';
import { DeleteComponent } from '../../dialogs/delete/delete.component';
import { ServicesDialogComponent } from '../services-dialog/services-dialog.component';
import { MatIcon } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
  templateUrl: './usermanagement.component.html',
  styleUrls: ['./usermanagement.component.scss'],
  standalone: true,
  imports: [
    ReusableCrudComponent,
    FormsModule,
    MatIcon,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class UsermanagementComponent implements OnInit {
  searchTerm: string = '';
  pageSize = 10;
  pageIndex = 0;
  sortField = 'username';
  sortDirection = 'asc';
  loading = false;
  isDeleting = false;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  tableData: TableUser[] = [];

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
    dataSource: [],
  };

  constructor(
    private usersClient: UsersClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private tenantServiceClient: TenantServiceClient
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.searchSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged(),
        filter((term) => term.length === 0 || term.length >= 2)
      )
      .subscribe((term) => {
        this.searchTerm = term;
        this.pageIndex = 0;
        this.loadUsers(term);
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  onSearch(term: string): void {
    this.searchSubject.next(term.trim());
    this.searchTerm = term;
    this.loadUsers(term);
  }

  async loadUsers(searchTerm?: string) {
    this.loading = true;
    this.usersClient.getAll().subscribe({
      next: (response) => {
        let users = response?.data || [];

        // Client-side filtering if search term exists
        if (searchTerm && searchTerm.length >= 1) {
          const term = searchTerm.toLowerCase();
          users = users.filter(
            (user) =>
              user.username?.toLowerCase().includes(term) ||
              user.email?.toLowerCase().includes(term) ||
              user.phoneNumber?.toString().includes(term)
          );
        }

        this.tableData = users.map((user) => this.mapToTableUser(user));
        this.config.dataSource = [...this.tableData];
      },
      error: (error) => {
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  mapToTableUser(user: UserDto): TableUser {
    return {
      username: user.username || 'N/A',
      phoneNumber: user.phoneNumber?.toString() || 'N/A',
      email: user.email || 'N/A',
      roleName: this.getRoleName(user.roleId ?? 0),
      status: user.isActive ? 'Active' : 'Inactive',
      rawData: user,
    };
  }

  getRoleName(roleId: number): string {
    const roles: Record<number, string> = {
      1: 'User',
      2: 'Admin',
      3: 'Super Admin',
      4: 'Client',
    };
    return roles[roleId] || 'Unknown';
  }

  onConfig(user: TableUser) {
    const tenantId = Number(this.authService.getUserTenantId());
    if (!tenantId) {
      return this.snackBar.open('No tenant information available', 'Close', {
        duration: 3000,
      });
    }

    this.tenantServiceClient
      .getServiceByTenantID()
      .subscribe((response: any) => {
        if (!response?.length) {
          this.snackBar.open('No services found for this tenant', 'Close', {
            duration: 3000,
          });
          return;
        }

        this.dialog.open(ServicesDialogComponent, {
          width: '90vw',
          maxWidth: '1200px',
          height: '85vh',
          data: { tenantId, services: response, user: user.rawData },
          disableClose: true,
        });
      });
    return;
  }

  onEdit(user: TableUser) {
    const dialogRef = this.dialog.open(UpdateComponent, {
      width: '800px',
      disableClose: true,
      data: { user: user.rawData },
    });

    dialogRef.afterClosed().subscribe((result: UserDto) => {
      if (result) this.updateUser(result);
    });
  }

  updateUser(user: UserDto) {
    this.loading = true;
    this.usersClient.updateUser(user).subscribe({
      next: () => {
        this.snackBar.open('User updated successfully', 'Close', {
          duration: 3000,
        });
        this.loadUsers();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err?.message || 'Update failed', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  onDelete(user: TableUser) {
    const dialogRef = this.dialog.open(DeleteComponent, {
      width: '450px',
      disableClose: true,
      data: { userId: user.rawData.userId, username: user.username },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed && user.rawData.userId) {
        this.deleteUser(user.rawData.userId);
      }
    });
  }

  deleteUser(userId: number) {
    this.isDeleting = true;
    this.usersClient.deleteById(userId).subscribe({
      next: () => {
        this.snackBar.open('User deleted successfully', 'Close', {
          duration: 3000,
        });
        this.loadUsers();
      },
      error: (err) => {
        this.snackBar.open(err?.message || 'Delete failed', 'Close', {
          duration: 3000,
        });
      },
      complete: () => (this.isDeleting = false),
    });
  }

  onAdd() {
    const dialogRef = this.dialog.open(AddComponent, {
      width: '800px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: UserDto) => {
      if (result) this.createUser(result);
    });
  }

  createUser(user: UserDto) {
    this.loading = true;
    this.usersClient.add(user).subscribe({
      next: () => {
        this.snackBar.open('User created successfully', 'Close', {
          duration: 3000,
        });
        this.loadUsers();
      },
      error: (err) => {
        this.snackBar.open(err?.message || 'Create failed', 'Close', {
          duration: 3000,
        });
        this.loading = false;
      },
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers(this.searchTerm);
  }

  onSortChange(event: Sort) {
    this.sortField = event.active;
    this.sortDirection = event.direction;
    this.loadUsers(this.searchTerm);
  }

  onRefresh() {
    this.loadUsers(this.searchTerm);
  }
}
