import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  SubscriptionDto,
  SubscriptionClient,
  UsersClient,
  SubServiceClient,
} from '../../../Services/api/api-client.service';
import { DateFormatService } from '../../../Services/dateFormate/date-format.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatFormField, MatLabel, MatError, MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { MatInputModule } from '@angular/material/input';

@Component({
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
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss'],
  providers: [DecimalPipe],
})
export class CounterComponent implements OnInit {
  loading = true;
  submitting = false;
  subscriptions: SubscriptionDto[] = [];
  filteredSubscriptions: SubscriptionDto[] = [];
  updateForm: FormGroup;

  // Data maps
  usernames = new Map<number, string>();
  subServiceNames = new Map<number, string>();
  endDates = new Map<number, string>();
  previousValues = new Map<number, number>();

  // Form controls
  searchControl = new FormControl('');

  constructor(
    private subscriptionClient: SubscriptionClient,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private userClient: UsersClient,
    private subServiceClient: SubServiceClient,
    private dateFormatter: DateFormatService,
    private decimalPipe: DecimalPipe
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
      : [...this.subscriptions];
  }

  private loadSubscriptions(): void {
    this.loading = true;
    this.subscriptionClient.getUserToAddCount().subscribe({
      next: (response) => {
        this.subscriptions = response.data || [];
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
      formControls[`${id}_quantity`] = [
        '',
        [Validators.required, Validators.min(0)],
      ];
      formControls[`${id}_note`] = [''];
    });

    this.updateForm = this.fb.group(formControls);
  }

  private fetchAdditionalData(): void {
    this.subscriptions.forEach((sub) => {
      this.fetchUsername(sub);
      this.fetchServiceName(sub);
      this.formatEndDate(sub);
      this.fetchPreviousValue(sub);
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

  private fetchPreviousValue(sub: SubscriptionDto): void {
    if (!sub.subscriptionId) return;

    this.subscriptionClient.getPreviousSubscription(sub).subscribe({
      next: (prevSub) => {
        if (prevSub.data?.quantity) {
          this.previousValues.set(
            sub.subscriptionId ?? 0,
            prevSub.data.quantity
          );
        }
      },
      error: () => {
        console.warn(
          `Could not fetch previous value for subscription ${sub.subscriptionId}`
        );
      },
    });
  }

  // onSubmit(): void {
  //   if (this.updateForm.invalid || this.submitting) return;

  //   this.submitting = true;
  //   const updates = this.prepareUpdates();

  //   if (updates.length === 0) {
  //     this.showNotification('No changes detected');
  //     this.submitting = false;
  //     return;
  //   }

  //   this.subscriptionClient.updateCounter(updates).subscribe({
  //     next: () => {
  //       this.showSuccess(`${updates.length} counters updated successfully`);
  //       this.loadSubscriptions();
  //     },
  //     error: (err) => {
  //       this.showError('Update failed: ' + err.message);
  //     },
  //   });
  // }
  onSubmit(): void {
    if (this.updateForm.invalid || this.submitting) return;

    this.submitting = true;
    const updates = this.prepareUpdates();

    if (updates.length === 0) {
      this.showNotification('No changes detected');
      this.submitting = false;
      return;
    }

    // Handle batch updates if your API supports it
    // Or update one by one
    this.processUpdates(updates);
  }

  private processUpdates(updates: SubscriptionDto[]): void {
    const updateObservables = updates.map((update) =>
      this.subscriptionClient.updateCounter(update)
    );

    // Using forkJoin to handle multiple updates
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
  private prepareUpdates(): SubscriptionDto[] {
    return this.filteredSubscriptions
      .filter(
        (sub) => this.updateForm.get(`${sub.subscriptionId}_quantity`)?.dirty
      )
      .map((sub) => {
        const update = new SubscriptionDto();
        Object.assign(update, sub);
        update.quantity = this.updateForm.get(
          `${sub.subscriptionId}_quantity`
        )?.value;
        return update;
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

  focusNextInput(event: Event, nextIndex: number): void {
    event.preventDefault();
    const inputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="number"]'
    );
    if (inputs[nextIndex]) inputs[nextIndex].focus();
  }

  focusPrevInput(event: Event, prevIndex: number): void {
    event.preventDefault();
    const inputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="number"]'
    );
    if (inputs[prevIndex]) inputs[prevIndex].focus();
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
}
