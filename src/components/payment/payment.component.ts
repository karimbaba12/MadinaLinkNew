import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Observable,
  of,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  map,
} from 'rxjs';
import {
  UsersClient,
  SubscriptionClient,
  TransactionClient,
  TransactionDto,
  SubscriptionDto,
  SubServiceClient,
  TransactionPaymentDto,
  FileResponse,
} from '../../../Services/api/api-client.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmPaymentComponent } from '../../dialogs/confirm-payment/confirm-payment.component';
import { saveAs } from 'file-saver';

interface User {
  userId: number;
  name: string;
  phoneNumber: number;
  email: string;
  createdAt: number;
  tenantId: number;
  username: string;
  roleId: number;
  isActive: boolean;
  transactionId: number;
  credit: number;
  debit: number;
  subscriptions: SubscriptionDto[];
}

interface Subscription extends SubscriptionDto {
  serviceName?: string;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatListModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  providers: [DatePipe],
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  searchForm: FormGroup;
  users$: Observable<User[]> | undefined;
  selectedUser: User | null = null;
  isLoading = false;
  isProcessingPayment = false;
  userBalance = 0;
  subServiceNames: { [key: number]: string } = {};
  displayedColumns: string[] = [
    'serviceName',
    'quantity',
    'startDate',
    'endDate',
    'price',
  ];

  constructor(
    private fb: FormBuilder,
    private userClient: UsersClient,
    private subscriptionClient: SubscriptionClient,
    private transactionClient: TransactionClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private subServiceClient: SubServiceClient
  ) {
    console.log('FileSaver available:', typeof saveAs !== 'undefined');
    this.searchForm = this.fb.group({
      searchTerm: ['', Validators.required],
    });

    this.paymentForm = this.fb.group({
      credit: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit(): void {
    this.setupUserSearch();
  }

  setupUserSearch(): void {
    this.users$ = this.searchForm.get('searchTerm')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => {
        if (term && term.length >= 2) {
          this.isLoading = true;
          return this.userClient.search(term).pipe(
            map((response: any) => {
              this.isLoading = false;
              return response.data || [];
            }),
            catchError((error) => {
              this.isLoading = false;
              console.error('Search error:', error);
              this.snackBar.open('Error searching users', 'Close', {
                duration: 3000,
              });
              return of([]);
            })
          );
        } else {
          return of([]);
        }
      })
    );
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.loadUserBalance(user.userId);
    this.loadSubServiceNames();
  }

  loadUserBalance(userId: number): void {
    this.transactionClient.getBalanceByID(userId).subscribe({
      next: (response: any) => {
        this.userBalance = response.data || 0;
      },
      error: (error) => {
        console.error('Balance load error:', error);
        this.snackBar.open('Failed to load user balance', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  getFormattedDate(timestamp: number): string {
    return (
      this.datePipe.transform(new Date(timestamp * 1000), 'mediumDate') || ''
    );
  }

  confirmPayment() {
    if (!this.selectedUser || this.paymentForm.invalid) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmPaymentComponent, {
      width: '450px',
      data: {
        user: this.selectedUser,
        amount: this.paymentForm.value.credit,
        paymentMethod: this.paymentForm.value.paymentMethod,
        balance: this.userBalance + Number(this.paymentForm.value.credit),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.confirmed) {
        this.processPayment(result.generateReceipt);
      }
    });
  }

  processPayment(generateReceipt: boolean = false): void {
    if (!this.selectedUser || this.paymentForm.invalid) {
      this.snackBar.open(
        'Please select a user and enter a valid amount',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    this.isProcessingPayment = true;

    const paymentData = new TransactionDto({
      userId: this.selectedUser.userId,
      credit: this.paymentForm.value.credit,
      debit: 0,
      tenantId: this.selectedUser.tenantId,
      createdAt: Math.floor(Date.now() / 1000),
    });

    this.transactionClient.add(paymentData).subscribe({
      next: (response) => {
        this.isProcessingPayment = false;
        this.showPaymentSuccess(response.data, generateReceipt);
        this.loadUserBalance(this.selectedUser!.userId);
      },
      error: (error) => {
        this.isProcessingPayment = false;
        this.snackBar.open(
          'Payment failed: ' + (error.error?.message || 'Unknown error'),
          'Close',
          { duration: 5000 }
        );
      },
    });
  }

  showPaymentSuccess(transaction: any, generateReceipt: boolean): void {
    const dialogRef = this.dialog.open(ConfirmPaymentComponent, {
      width: '450px',
      data: {
        success: true,
        user: this.selectedUser,
        amount: this.paymentForm.value.credit,
        paymentMethod: this.paymentForm.value.paymentMethod,
        transactionId: transaction.transactionId,
        balance: this.userBalance + Number(this.paymentForm.value.credit),
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      if (generateReceipt) {
        this.generateReceipt(transaction);
      }
      this.resetForm();
    });
  }

  generateReceipt(transaction: any): void {
    if (!this.selectedUser) {
      return;
    }

    const receiptData = new TransactionPaymentDto();

    // Set basic transaction info
    receiptData.transactionId = transaction.transactionId?.toString() || '';
    // Set user info from selectedUser
    receiptData.userId = this.selectedUser.userId;
    receiptData.name = this.selectedUser.name;
    receiptData.phoneNumber = this.selectedUser.phoneNumber;
    receiptData.email = this.selectedUser.email || '';
    receiptData.createdAt = Math.floor(Date.now() / 1000);
    receiptData.tenantId = this.selectedUser.tenantId;
    receiptData.username = this.selectedUser.username;
    receiptData.roleId = this.selectedUser.roleId;
    receiptData.isActive = this.selectedUser.isActive;

    // Set transaction amounts
    receiptData.credit = this.paymentForm.value.credit;
    receiptData.debit = 0;

    // Map subscriptions
    receiptData.subscriptions =
      this.selectedUser.subscriptions?.map((sub) => {
        const subscription = new SubscriptionDto();
        subscription.subscriptionId = sub.subscriptionId;
        subscription.subServiceId = sub.subServiceId;
        subscription.userId = sub.userId;
        subscription.startDate = sub.startDate;
        subscription.endDate = sub.endDate;
        subscription.price = sub.price;
        subscription.quantity = sub.quantity;
        subscription.discount = sub.discount;
        subscription.isActive = sub.isActive;
        subscription.tenantId = sub.tenantId;
        return subscription;
      }) || [];

    this.transactionClient.generateReceipt(receiptData).subscribe({
      next: (response: FileResponse) => {
        const blob = new Blob([response.data], {
          type: response.data.type,
        });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        saveAs(blob, `Receipt_${receiptData.transactionId}.pdf`);
        this.snackBar.open('Receipt downloaded successfully', 'Close', {
          duration: 3000,
        });
      },
      error: (error) => {
        console.error('Error generating receipt:', error);
        this.snackBar.open('Failed to generate receipt', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  loadSubServiceNames(): void {
    const uniqueIds = [
      ...new Set(
        this.selectedUser?.subscriptions?.map((sub) => sub.subServiceId) || []
      ),
    ];

    uniqueIds.forEach((id) => {
      if (id) {
        this.subServiceClient.getById(id).subscribe({
          next: (response) => {
            this.subServiceNames[id] =
              response.data?.subServiceName || 'Unknown';
          },
          error: (error) => {
            console.error('Error fetching subscription name:', error);
            this.subServiceNames[id] = 'Unknown';
          },
        });
      }
    });
  }

  getSubServiceName(subServiceId: number): string {
    return this.subServiceNames[subServiceId] || 'Loading...';
  }

  resetForm(): void {
    this.selectedUser = null;
    this.userBalance = 0;
    this.subServiceNames = {};
    this.searchForm.reset();
    this.paymentForm.reset({
      paymentMethod: 'cash',
    });
  }
}
