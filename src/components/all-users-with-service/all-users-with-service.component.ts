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
  SubscriptionClient,
  SubServiceClient,
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
import { CommonModule } from '@angular/common';
import { DateFormatService } from '../../../Services/dateFormate/date-format.service';
interface TableUser {
  username: string;
  subServiceName: string;
  endDate: string;
  status: string;
  rawData: UserDto;
  rawEndDate?: number; // Store the original Unix timestamp if needed
}

@Component({
  selector: 'app-all-users-with-service',
  standalone: true,
  imports: [
    ReusableCrudComponent,
    FormsModule,
    MatIcon,
    MatFormFieldModule,
    MatInputModule,
    CommonModule,
  ],
  templateUrl: './all-users-with-service.component.html',
  styleUrl: './all-users-with-service.component.scss',
})
export class AllUsersWithServiceComponent {
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
  currentServiceFilter: number = 1;
  serviceButtons = [
    { id: 1, name: 'Electricity', icon: 'bolt' },
    { id: 2, name: 'Water', icon: 'water_drop' },
    { id: 3, name: 'Internet', icon: 'wifi' },
  ];
  config: CrudTableConfig<TableUser> = {
    title: 'Users Service Subscriptions',
    columns: [
      { name: 'username', header: 'Name', sortable: true },
      { name: 'subServiceName', header: 'Service Name', sortable: false },
      { name: 'endDate', header: 'End Date', sortable: true },
      { name: 'status', header: 'Status', sortable: true },
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
    private tenantServiceClient: TenantServiceClient,
    private subscriptionClient: SubscriptionClient,
    private subServiceClient: SubServiceClient,
    private dateFormatter: DateFormatService
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
    this.subscriptionClient
      .usersByService(this.currentServiceFilter)
      .subscribe({
        next: async (response) => {
          let users = response?.data || [];

          if (searchTerm && searchTerm.length >= 1) {
            const term = searchTerm.toLowerCase();
            users = users.filter(
              (user) =>
                user.username?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                user.phoneNumber?.toString().includes(term)
            );
          }

          const mappedUsers: TableUser[] = [];
          for (const user of users) {
            const subscriptions = await this.subscriptionClient
              .getUserSubscription(user.userId)
              .toPromise();

            if (subscriptions && (subscriptions.data?.length ?? 0) > 0) {
              const sub = (subscriptions?.data || [])[0];
              let subServiceName = 'N/A';
              let endDate = 'N/A';
              let status = user.isActive ? 'Active' : 'Inactive';

              if (sub) {
                // Format the Unix timestamp using the dateFormatter service
                endDate = sub.endDate
                  ? this.dateFormatter.unixToDateString(sub.endDate)
                  : 'N/A';

                try {
                  const subService = await this.subServiceClient
                    .getById(sub.subServiceId!)
                    .toPromise();
                  subServiceName = subService?.data?.subServiceName || 'N/A';
                } catch (e) {
                  subServiceName = 'N/A';
                }
              }

              mappedUsers.push({
                username: user.username || 'N/A',
                subServiceName,
                endDate, // This now contains the formatted date
                status,
                rawData: user,
                rawEndDate: sub?.endDate, // Store the original Unix timestamp if needed
              });
            }
          }

          this.tableData = mappedUsers;
          this.config.dataSource = [...this.tableData];
        },
        error: (error) => {
          this.snackBar.open('Failed to load users', 'Close', {
            duration: 3000,
          });
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  // mapToTableUser(user: UserDto): TableUser {
  //   return {
  //     username: user.username || 'N/A',
  //     phoneNumber: user.phoneNumber?.toString() || 'N/A',
  //     email: user.email || 'N/A',
  //     roleName: this.getRoleName(user.roleId ?? 0),
  //     status: user.isActive ? 'Active' : 'Inactive',
  //     rawData: user,
  //   };
  // }

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
  selectService(serviceId: number): void {
    this.currentServiceFilter = serviceId;
    this.loadUsers(this.searchTerm);
  }
}
