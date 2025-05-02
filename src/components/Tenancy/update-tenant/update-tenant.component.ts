import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  TenantClient,
  TenantDto,
} from '../../../../Services/api/api-client.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  takeUntil,
} from 'rxjs/operators';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-update-tenant',
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatPaginatorModule,
  ],
  templateUrl: './update-tenant.component.html',
  styleUrls: ['./update-tenant.component.scss'],
})
export class UpdateTenantComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  tenantForm: FormGroup;
  loading = false;

  // Pagination properties
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];
  totalItems = 0;

  // Data properties
  allTenants: TenantDto[] = [];
  displayedTenants: TenantDto[] = [];
  showInactiveOnly = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private tenantClient: TenantClient,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.tenantForm = this.fb.group({
      tenantId: [0],
      tenantName: [''],
      address: [''],
      email: [''],
      phoneNumber: [''],
      createdAt: [0],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    this.loadTenants();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        filter((term) => term.length === 0 || term.length >= 2)
      )
      .subscribe((term) => {
        this.searchTerm = term;
        this.applyFilters();
      });
  }

  loadTenants(): void {
    this.loading = true;
    this.tenantClient.getAll().subscribe({
      next: (response) => {
        this.allTenants = response?.data || [];
        this.totalItems = this.allTenants.length;
        this.applyFilters();
      },
      error: () => {
        this.snackBar.open('Failed to load tenants', 'Close', {
          duration: 3000,
        });
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    let result = [...this.allTenants];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(
        (tenant) =>
          tenant.tenantName?.toLowerCase().includes(term) ||
          tenant.email?.toLowerCase().includes(term) ||
          tenant.phoneNumber?.toString().includes(term)
      );
    }

    // Apply active/inactive filter
    if (this.showInactiveOnly) {
      result = result.filter((tenant) => !tenant.isActive);
    }

    // Update total items count
    this.totalItems = result.length;

    // Apply pagination
    this.updateDisplayedTenants(result);
  }

  updateDisplayedTenants(filteredTenants: TenantDto[]): void {
    const startIndex = this.pageIndex * this.pageSize;
    this.displayedTenants = filteredTenants.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFilters();
  }

  toggleInactiveFilter(): void {
    this.showInactiveOnly = !this.showInactiveOnly;
    this.pageIndex = 0; // Reset to first page when changing filter
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.showInactiveOnly = false;
    this.pageIndex = 0; // Reset to first page when resetting filters
    this.applyFilters();
  }

  onSearchInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchSubject.next(term.trim());
  }

  toggleStatus(tenant: TenantDto): void {
    const updatedTenant = new TenantDto();
    Object.assign(updatedTenant, tenant, { isActive: !tenant.isActive });
    this.tenantClient.update(updatedTenant).subscribe({
      next: () => {
        tenant.isActive = updatedTenant.isActive;
        this.applyFilters();
        this.snackBar.open(
          `Tenant ${
            tenant.isActive ? 'activated' : 'deactivated'
          } successfully`,
          'Close',
          { duration: 2000 }
        );
      },
      error: () => {
        this.snackBar.open('Failed to update tenant status', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
