import { CommonModule, DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  MatCard,
  MatCardHeader,
  MatCardContent,
  MatCardTitle,
  MatCardActions,
} from '@angular/material/card';
import {
  MatFormField,
  MatLabel,
  MatFormFieldModule,
  MatError,
} from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import {
  MatTableModule,
  MatCellDef,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRowDef,
} from '@angular/material/table';
import { TransactionActionsComponent } from '../../dialogs/transactions/transaction-actions/transaction-actions.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import {
  SubscriptionDto,
  SubscriptionClient,
  UsersClient,
  SubServiceClient,
  CountersClient,
  FileResponse,
} from '../../../Services/api/api-client.service';
import { DateFormatService } from '../../../Services/dateFormate/date-format.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-counter-history',
  imports: [
    MatFormField,
    MatLabel,
    MatIcon,
    ReactiveFormsModule,
    MatError,
    MatProgressSpinner,
    MatTableModule,
    CommonModule,
    MatFormField,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './counter-history.component.html',
  styleUrl: './counter-history.component.scss',
  providers: [DecimalPipe],
})
export class CounterHistoryComponent {
  loading = true;
  submitting = false;
  subscriptions: SubscriptionDto[] = [];
  filteredSubscriptions: SubscriptionDto[] = [];
  updateForm: FormGroup;

  // Data maps
  usernames = new Map<number, string>();
  subServiceNames = new Map<number, string>();
  endDates = new Map<number, string>();

  // Form controls
  searchControl = new FormControl('');

  constructor(
    private subscriptionClient: SubscriptionClient,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private userClient: UsersClient,
    private subServiceClient: SubServiceClient,
    private dateFormatter: DateFormatService,
    private decimalPipe: DecimalPipe,
    private counterClient: CountersClient,
    private router: Router
  ) {
    this.updateForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadSubscriptions();
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => this.filterSubscriptions(searchTerm || ''));
  }

  private filterSubscriptions(searchTerm: string): void {
    this.filteredSubscriptions = searchTerm
      ? this.subscriptions.filter((sub) => {
          const username =
            this.usernames.get(sub.userId ?? 0)?.toLowerCase() || '';
          const serviceName =
            this.subServiceNames.get(sub.subServiceId ?? 0)?.toLowerCase() ||
            '';
          return (
            username.includes(searchTerm.toLowerCase()) ||
            serviceName.includes(searchTerm.toLowerCase())
          );
        })
      : [...this.subscriptions].reverse();
  }

  private loadSubscriptions(): void {
    this.loading = true;
    this.subscriptionClient.getAll().subscribe({
      next: (response) => {
        // Reverse the array to show newest first
        this.subscriptions = response.data?.reverse() || [];
        this.filteredSubscriptions = [...this.subscriptions];
        this.initializeComponentData();
        this.loading = false;
      },
      error: (err) => {
        this.showError('Failed to load subscriptions');
        this.loading = false;
      },
    });
  }

  private initializeComponentData(): void {
    this.createFormControls();
    this.fetchAdditionalData();
  }

  private createFormControls(): void {
    const formControls: Record<string, any> = {};

    this.subscriptions.forEach((sub) => {
      const id = sub.subscriptionId?.toString() || '';
      formControls[`${id}_previous`] = [
        sub.previousQuantity || 0,
        [Validators.min(0), Validators.required],
      ];
      formControls[`${id}_current`] = [
        sub.quantity || 0,
        [Validators.min(0), Validators.required],
      ];
    });

    this.updateForm = this.fb.group(formControls);
  }

  private fetchAdditionalData(): void {
    this.subscriptions.forEach((sub) => {
      this.fetchUsername(sub);
      this.fetchServiceName(sub);
      this.formatEndDate(sub);
    });
  }

  private fetchUsername(sub: SubscriptionDto): void {
    if (!sub.userId) return;

    this.userClient.getById(sub.userId).subscribe({
      next: (result) => {
        this.usernames.set(
          sub.userId ?? 0,
          result?.data?.name?.toUpperCase() || `User ${sub.userId}`
        );
      },
      error: () => {
        this.usernames.set(sub.userId ?? 0, `User ${sub.userId}`);
      },
    });
  }

  private fetchServiceName(sub: SubscriptionDto): void {
    if (!sub.subServiceId) return;

    this.subServiceClient.getById(sub.subServiceId).subscribe({
      next: (result) => {
        this.subServiceNames.set(
          sub.subServiceId ?? 0,
          result?.data?.subServiceName?.toUpperCase() ||
            `Service ${sub.subServiceId}`
        );
      },
      error: () => {
        this.subServiceNames.set(
          sub.subServiceId ?? 0,
          `Service ${sub.subServiceId}`
        );
      },
    });
  }

  private formatEndDate(sub: SubscriptionDto): void {
    if (sub.subscriptionId && sub.endDate) {
      this.endDates.set(
        sub.subscriptionId,
        this.dateFormatter.unixToDateString(sub.endDate)
      );
    }
  }

  onSubmit(): void {
    if (this.updateForm.invalid || this.submitting) return;

    this.submitting = true;
    const updates = this.prepareUpdates();

    if (updates.length === 0) {
      this.showNotification('No changes detected');
      this.submitting = false;
      return;
    }

    this.processUpdates(updates);
  }

  private prepareUpdates(): SubscriptionDto[] {
    return this.filteredSubscriptions
      .filter((sub) => {
        const previousControl = this.updateForm.get(
          `${sub.subscriptionId}_previous`
        );
        const currentControl = this.updateForm.get(
          `${sub.subscriptionId}_current`
        );

        // Include if either field is dirty
        return (
          (previousControl?.dirty || currentControl?.dirty) &&
          sub.subscriptionId !== undefined
        );
      })
      .map((sub) => {
        const update = new SubscriptionDto({
          subscriptionId: sub.subscriptionId,
          previousQuantity: Number(
            this.updateForm.get(`${sub.subscriptionId}_previous`)?.value
          ),
          quantity: Number(
            this.updateForm.get(`${sub.subscriptionId}_current`)?.value
          ),
        });
        return update;
      });
  }

  private processUpdates(updates: SubscriptionDto[]): void {
    const updateObservables = updates.map((update) =>
      this.subscriptionClient.updateCounterHistory(update)
    );

    forkJoin(updateObservables).subscribe({
      next: () => {
        this.showSuccess(`${updates.length} counters updated successfully`);
        this.loadSubscriptions();
      },
      error: (err) => {
        this.showError('Update failed: ' + err.message);
      },
      complete: () => {
        this.submitting = false;
      },
    });
  }

  // Helper methods
  get completedCount(): number {
    return this.subscriptions.filter((s) => !s.isActive).length;
  }

  trackById(index: number, item: SubscriptionDto): number {
    return item.subscriptionId ?? index;
  }

  formatNumber(value: number | undefined): string {
    return this.decimalPipe.transform(value, '1.0-0') || '0';
  }

  // Notification methods
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
    this.submitting = false;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
    this.submitting = false;
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
  goBack(): void {
    this.router.navigate(['admin/counter']);
  }
}
