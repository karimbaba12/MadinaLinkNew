import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormsModule,
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
  forkJoin,
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { saveAs } from 'file-saver';
import { NewConfirmComponent } from '../../dialogs/new-confirm/new-confirm.component';

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
  amountDue?: number;
  balance?: number;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatListModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatTooltipModule,
    MatMenuModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  providers: [DatePipe],
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  searchForm: FormGroup;
  users$: Observable<User[]> | undefined;
  usersToPay: User[] = [];
  selectedUser: User | null = null;
  isLoading = false;
  isProcessingPayment = false;
  isFetchingUsersToPay = false;
  subServiceNames: { [key: number]: string } = {};
  displayedColumns: string[] = [
    'select',
    'name',
    'amountDue',
    'balance',
    'actions',
  ];
  displayedSubscriptionColumns: string[] = [
    'serviceName',
    'quantity',
    'period',
    'price',
  ];
  selectedUsers: User[] = [];
  selectAllChecked = false;
  totalAmountDue = 0;
  selectedAmount = 0;

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
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['cash', Validators.required],
      notes: [''],
    });

    this.searchForm = this.fb.group({
      searchTerm: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadUsersToPay();
    this.setupUserSearch();
  }

  loadUsersToPay(): void {
    this.isFetchingUsersToPay = true;
    this.userClient.getUserToPay().subscribe({
      next: (response: any) => {
        this.usersToPay = response?.data || [];
        this.usersToPay.forEach((user) => {
          this.loadUserBalance(user);
        });
        this.calculateTotalAmountDue();
        this.isFetchingUsersToPay = false;
      },
      error: (error) => {
        console.error('Error loading users to pay:', error);
        this.usersToPay = [];
        this.isFetchingUsersToPay = false;
        this.snackBar.open('Failed to load pending payments', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar',
        });
      },
    });
  }

  loadUserBalance(user: User): void {
    this.transactionClient.getBalanceByID(user.userId).subscribe({
      next: (response: any) => {
        user.balance = response?.data || 0;
        // Auto-set amount due to balance if not already set
        if (!user.amountDue) {
          user.amountDue = user.balance;
        }
      },
      error: (error) => {
        console.error('Error loading user balance:', error);
        user.balance = 0;
      },
    });
  }

  calculateTotalAmountDue(): void {
    this.totalAmountDue = this.usersToPay.reduce(
      (sum, user) => sum + (user.amountDue || 0),
      0
    );
    this.selectedAmount = this.selectedUsers.reduce(
      (sum, user) => sum + (user.amountDue || 0),
      0
    );
  }

  // In setupUserSearch() method
  setupUserSearch(): void {
    const searchTermControl = this.searchForm.get('searchTerm');

    if (!searchTermControl) {
      return;
    }

    this.users$ = searchTermControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (term && term.length >= 2) {
          this.isLoading = true;
          return this.userClient.search(term).pipe(
            switchMap((response: any) => {
              const users = (response?.data as User[]) || [];
              if (users.length === 0) {
                return of([]);
              }

              // Load balance for each user
              return forkJoin(
                users.map((user: User) =>
                  this.transactionClient.getBalanceByID(user.userId).pipe(
                    map((balanceResponse: any) => ({
                      ...user,
                      balance: (balanceResponse?.data as number) || 0,
                    })),
                    catchError(() =>
                      of({
                        ...user,
                        balance: 0,
                      })
                    )
                  )
                )
              ) as Observable<User[]>;
            }),
            catchError((error: any) => {
              this.isLoading = false;
              console.error('Search error:', error);
              this.snackBar.open('Error searching users', 'Close', {
                duration: 3000,
                panelClass: 'error-snackbar',
              });
              return of([]);
            })
          );
        }
        return of([]);
      })
    );
  }

  isUserSelected(user: User): boolean {
    return this.selectedUsers.some((u) => u.userId === user.userId);
  }

  toggleUserSelection(user: User): void {
    const index = this.selectedUsers.findIndex((u) => u.userId === user.userId);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(user);
    }
    this.selectAllChecked =
      this.selectedUsers.length === this.usersToPay.length;
    this.calculateTotalAmountDue();
  }

  toggleSelectAll(): void {
    if (this.selectAllChecked) {
      this.selectedUsers = [...this.usersToPay];
    } else {
      this.selectedUsers = [];
    }
    this.calculateTotalAmountDue();
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.paymentForm.patchValue({
      amount: user.amountDue || user.balance || 0,
    });
    this.loadSubServiceNames();
  }

  updateUserAmount(user: User, amount: number): void {
    if (amount < 0) amount = 0;
    user.amountDue = amount;
    this.calculateTotalAmountDue();
  }

  loadSubServiceNames(): void {
    if (!this.selectedUser?.subscriptions) return;

    const subServiceIds = [
      ...new Set(
        this.selectedUser.subscriptions.map((sub) => sub.subServiceId)
      ),
    ];

    subServiceIds.forEach((id) => {
      if (id && !this.subServiceNames[id]) {
        this.subServiceClient.getById(id).subscribe({
          next: (response) => {
            this.subServiceNames[id] =
              response.data?.subServiceName || 'Unknown';
          },
          error: (error) => {
            console.error('Error loading service name:', error);
            this.subServiceNames[id] = 'Unknown';
          },
        });
      }
    });
  }

  getSubServiceName(subServiceId: number): string {
    return this.subServiceNames[subServiceId] || 'Loading...';
  }

  getFormattedDate(timestamp: number): string {
    return (
      this.datePipe.transform(new Date(timestamp * 1000), 'mediumDate') || ''
    );
  }

  confirmPayment(): void {
    if (!this.selectedUser || this.paymentForm.invalid) {
      return;
    }

    const dialogRef = this.dialog.open(NewConfirmComponent, {
      width: '450px',
      data: {
        user: this.selectedUser,
        amount: this.paymentForm.value.amount,
        paymentMethod: this.paymentForm.value.paymentMethod,
        balance:
          (this.selectedUser.balance || 0) -
          Number(this.paymentForm.value.amount),
        isConfirmation: true,
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
        {
          duration: 3000,
          panelClass: 'error-snackbar',
        }
      );
      return;
    }

    this.isProcessingPayment = true;

    const paymentData = new TransactionDto({
      userId: this.selectedUser.userId,
      credit: this.paymentForm.value.amount,
      debit: 0,
      tenantId: this.selectedUser.tenantId,
      createdAt: Math.floor(Date.now() / 1000),
    });

    this.transactionClient.add(paymentData).subscribe({
      next: (response) => {
        this.isProcessingPayment = false;
        this.showPaymentSuccess(response.data, generateReceipt);
        this.loadUserBalance(this.selectedUser!);
        this.loadUsersToPay();
      },
      error: (error) => {
        this.isProcessingPayment = false;
        this.snackBar.open(
          'Payment failed: ' + (error.error?.message || 'Unknown error'),
          'Close',
          {
            duration: 5000,
            panelClass: 'error-snackbar',
          }
        );
      },
    });
  }

  showPaymentSuccess(transaction: any, generateReceipt: boolean): void {
    const dialogRef = this.dialog.open(NewConfirmComponent, {
      width: '450px',
      data: {
        user: this.selectedUser,
        amount: this.paymentForm.value.amount,
        paymentMethod: this.paymentForm.value.paymentMethod,
        transactionId: transaction.transactionId,
        balance:
          (this.selectedUser?.balance || 0) +
          Number(this.paymentForm.value.amount),
        isSuccess: true,
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
    if (!this.selectedUser) return;

    const receiptData = new TransactionPaymentDto();

    receiptData.transactionId = transaction.transactionId;
    receiptData.userId = this.selectedUser.userId;
    receiptData.name = this.selectedUser.name;
    receiptData.phoneNumber = this.selectedUser.phoneNumber;
    receiptData.email = this.selectedUser.email || '';
    receiptData.createdAt = Math.floor(Date.now() / 1000);
    receiptData.tenantId = this.selectedUser.tenantId;
    receiptData.username = this.selectedUser.username;
    receiptData.roleId = this.selectedUser.roleId;
    receiptData.isActive = this.selectedUser.isActive;

    receiptData.credit = this.paymentForm.value.credit;
    receiptData.debit = 0;

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
        const blob = new Blob([response.data], { type: response.data.type });
        saveAs(blob, `Receipt_${receiptData.transactionId}.pdf`);
        this.snackBar.open('Receipt downloaded successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
      },
      error: (error) => {
        console.error('Error generating receipt:', error);
        this.snackBar.open('Failed to generate receipt', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar',
        });
      },
    });
  }

  resetForm(): void {
    this.selectedUser = null;
    this.subServiceNames = {};
    this.searchForm.reset();
    this.paymentForm.reset({
      paymentMethod: 'cash',
    });
  }

  async processBulkPayment(
    generateReceipt: boolean = false,
    users?: User[]
  ): Promise<void> {
    this.isProcessingPayment = true;
    const timestamp = Math.floor(Date.now() / 1000);

    try {
      // Process payments first
      const paymentPromises = this.selectedUsers.map((user) => {
        const paymentData = new TransactionDto({
          userId: user.userId,
          credit: user.amountDue || 0,
          debit: 0,
          tenantId: user.tenantId,
          createdAt: timestamp,
        });
        return this.transactionClient.add(paymentData).toPromise();
      });

      await Promise.all(paymentPromises);

      // Generate receipts if requested
      if (generateReceipt && users) {
        await this.generateBulkReceipts(users, timestamp);
      }

      this.snackBar.open(
        `Successfully processed ${this.selectedUsers.length} payments`,
        'Close',
        { duration: 5000, panelClass: 'success-snackbar' }
      );

      this.selectedUsers = [];
      this.loadUsersToPay();
    } catch (error) {
      this.snackBar.open('Some payments failed: ' + 'Unknown error', 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar',
      });
    } finally {
      this.isProcessingPayment = false;
    }
  }

  async generateBulkReceipts(users: User[], timestamp: number): Promise<void> {
    const receiptPromises = users.map((user) => {
      const receiptData = new TransactionPaymentDto();
      receiptData.transactionId = timestamp;
      receiptData.userId = user.userId;
      receiptData.name = user.name;
      receiptData.phoneNumber = user.phoneNumber;
      receiptData.email = user.email || '';
      receiptData.createdAt = timestamp;
      receiptData.tenantId = user.tenantId;
      receiptData.credit = user.amountDue || 0;
      receiptData.debit = 0;
      receiptData.subscriptions = user.subscriptions || [];

      return this.transactionClient
        .generateReceipt(receiptData)
        .toPromise()
        .then((response: FileResponse | undefined) => {
          if (response) {
            const blob = new Blob([response.data], {
              type: response.data.type,
            });
            saveAs(blob, `Receipt_${user.name}_${timestamp}.pdf`);
            return user.name;
          }
          throw new Error('Response is undefined');
        });
    });

    try {
      const results = await Promise.all(receiptPromises);
      this.snackBar.open(
        `Generated ${results.length} receipts successfully`,
        'Close',
        { duration: 5000, panelClass: 'success-snackbar' }
      );
    } catch (error) {
      this.snackBar.open('Some receipts failed to generate', 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar',
      });
    }
  }

  // Update confirmBulkPayment to handle the new flow
  confirmBulkPayment(): void {
    if (this.selectedUsers.length === 0) {
      this.snackBar.open('Please select at least one user', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar',
      });
      return;
    }

    const dialogRef = this.dialog.open(NewConfirmComponent, {
      width: '500px',
      data: {
        users: this.selectedUsers,
        amount: this.selectedAmount,
        paymentMethod: this.paymentForm.value.paymentMethod,
        isBulkPayment: true,
        isConfirmation: true,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.confirmed) {
        await this.processBulkPayment(result.generateReceipt, result.bulkUsers);
      }
    });
  }
}
