import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  SubscriptionDto,
  SubscriptionClient,
  UsersClient,
  SubServiceClient,
} from '../../../Services/api/api-client.service';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';
import {
  MatError,
  MatFormField,
  MatFormFieldModule,
  MatLabel,
} from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { DateFormatService } from '../../../Services/dateFormate/date-format.service';

@Component({
  selector: 'app-counter',
  imports: [
    MatCardActions,
    MatFormField,
    MatLabel,
    MatIcon,
    MatProgressSpinner,
    MatError,
    MatCardContent,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './counter.component.html',
  styleUrl: './counter.component.scss',
})
export class CounterComponent implements OnInit {
  loading = true;
  submitting = false;
  subscriptions: SubscriptionDto[] = [];
  displayedColumns: string[] = ['user', 'currentValue', 'newValue', 'actions'];
  updateForms: FormGroup[] = [];
  usernames: Map<number, string> = new Map();
  subServiceName: Map<number, string> = new Map();
  DateFormatted: Map<number, string> = new Map();

  constructor(
    private subscriptionClient: SubscriptionClient,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private userClient: UsersClient,
    private subServiceClient: SubServiceClient,
    private dateformatter: DateFormatService
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading = true;
    this.subscriptionClient.getUserToAddCount().subscribe({
      next: (response) => {
        this.subscriptions = response.data || [];
        this.createForms();
        this.fetchUsernames();
        this.fetchSubServiceName();
        this.DateFormatting();
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load subscriptions', 'Close', {
          duration: 3000,
        });
        this.loading = false;
      },
    });
  }

  createForms(): void {
    this.updateForms = this.subscriptions.map((sub) =>
      this.fb.group({
        subscriptionId: [sub.subscriptionId],
        newQuantity: ['', [Validators.required, Validators.min(0)]],
        note: [''],
      })
    );
  }

  onSubmit(index: number): void {
    const form = this.updateForms[index];
    if (form.invalid) return;

    this.submitting = true;
    const subscription = this.subscriptions[index];
    const updatingData = new SubscriptionDto();
    updatingData.quantity = form.value.newQuantity;

    const updateData = {
      ...subscription,
      quantity: form.value.newQuantity,
      init: subscription.init,
      toJSON: subscription.toJSON,
    };

    this.subscriptionClient.updateCounter(updateData).subscribe({
      next: () => {
        console.log(updateData);
        this.snackBar.open('Counter updated successfully', 'Close', {
          duration: 3000,
        });
        this.subscriptions[index].isActive = false;
        this.submitting = false;
      },
      error: (err) => {
        this.snackBar.open('Update failed: ' + err.message, 'Close', {
          duration: 3000,
        });
        this.submitting = false;
      },
    });
  }

  fetchSubServiceName(): void {
    this.subscriptions.forEach((subscription) => {
      this.subServiceClient.getById(subscription.subServiceId).subscribe({
        next: (result) => {
          const subServiceName =
            result?.data?.subServiceName?.toUpperCase() ||
            `User ${subscription.subServiceId}`;
          this.subServiceName.set(
            subscription.subServiceId ?? 0,
            subServiceName
          );
        },
        error: () => {
          this.subServiceName.set(
            subscription.subServiceId ?? 0,
            `User ${subscription.subServiceId}`
          );
        },
      });
    });
  }

  fetchUsernames(): void {
    this.subscriptions.forEach((subscription) => {
      this.userClient.getById(subscription.userId).subscribe({
        next: (result) => {
          const username =
            result?.data?.name?.toUpperCase() || `User ${subscription.userId}`;
          this.usernames.set(subscription.userId ?? 0, username);
        },
        error: () => {
          this.usernames.set(
            subscription.userId ?? 0,
            `User ${subscription.userId}`
          );
        },
      });
    });
  }
  DateFormatting(): void {
    this.subscriptions.forEach((subscription) => {
      const formattedDate = this.dateformatter.unixToDateString(
        subscription.endDate ?? 0
      );
      this.DateFormatted.set(subscription.subscriptionId ?? 0, formattedDate);
    });
  }
}
