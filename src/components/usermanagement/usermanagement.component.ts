import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
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
  @ViewChild('rowActions') rowActionsTemplate!: TemplateRef<any>;
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
  filteredData: TableUser[] = [];

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
    pageSizeOptions: [10],
    defaultPageSize: 10,
    pageSize: 10,
    totalItems: 0,
    numeric: 10,
  };

  constructor(
    private usersClient: UsersClient,

    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private tenantServiceClient: TenantServiceClient
  ) {}
  ngOnInit() {
    this.setupSearch();
    this.loadInitialUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialUsers(): void {
    this.loading = true;
    this.usersClient
      .getAll()
      .pipe(
        tap((response) => {
          this.tableData = (response?.data || []).map((user) =>
            this.mapToTableUser(user)
          );
          this.applyFiltersAndPagination();
        }),
        catchError((error) => {
          this.snackBar.open('Failed to load users', 'Close', {
            duration: 3000,
          });
          return of(undefined);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        tap((term) => {
          this.searchTerm = term;
          this.pageIndex = 0;
          this.applyFiltersAndPagination(term); // Just filter existing data
        })
      )
      .subscribe();
  }

  onSearch(term: string): void {
    this.searchSubject.next(term.trim());
  }

  loadUsers(searchTerm?: string): Observable<void> {
    this.loading = true;

    return this.usersClient.getAll().pipe(
      tap((response) => {
        this.tableData = (response?.data || []).map((user) =>
          this.mapToTableUser(user)
        );
        this.applyFiltersAndPagination(searchTerm);
      }),
      map(() => undefined), // Convert to Observable<void>
      finalize(() => (this.loading = false))
    );
  }

  private applyFiltersAndPagination(searchTerm?: string): void {
    // Start with all data
    let filtered = [...this.tableData];

    // Apply search filter if term exists
    if (searchTerm && searchTerm.length >= 1) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.username?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.phoneNumber?.toString().includes(term)
      );
    }

    // Apply sorting
    filtered = this.sortData(filtered);

    // Update the displayed data
    this.config.dataSource = this.paginateData(filtered);
    this.config.totalItems = filtered.length;
  }

  private paginateData(data: TableUser[]): TableUser[] {
    const startIndex = this.pageIndex * this.pageSize;
    return data.slice(startIndex, startIndex + this.pageSize);
  }

  private sortData(data: TableUser[]): TableUser[] {
    return [...data].sort((a, b) => {
      const valueA = a[this.sortField as keyof TableUser];
      const valueB = b[this.sortField as keyof TableUser];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      return 0;
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
    // Just apply filters/pagination to existing data instead of fetching
    this.applyFiltersAndPagination(this.searchTerm);
  }

  onSortChange(event: Sort) {
    this.sortField = event.active;
    this.sortDirection = event.direction;
    // Just apply filters/pagination to existing data instead of fetching
    this.applyFiltersAndPagination(this.searchTerm);
  }

  onRefresh() {
    this.loadUsers(this.searchTerm);
  }
}
