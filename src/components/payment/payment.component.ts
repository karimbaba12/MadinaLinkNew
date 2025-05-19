import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  FormControl,
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
  SubServiceDto,
} from '../../../Services/api/api-client.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { saveAs } from 'file-saver';
import { NewConfirmComponent } from '../../dialogs/new-confirm/new-confirm.component';
import { MatDivider, MatListModule } from '@angular/material/list';

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
  subServiceNames?: string[];
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
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  paymentForm: FormGroup;
  searchForm: FormGroup;
  users$: Observable<User[]> | undefined;
  usersToPay: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  isLoading = false;
  isProcessingPayment = false;
  isFetchingUsersToPay = false;
  isSearching = false;
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
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 100];

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
      searchTerm: [''],
    });
  }

  ngOnInit(): void {
    this.loadUsersToPay();
  }

  loadUsersToPay(): void {
    console.log('Loading users to pay...');
    this.isFetchingUsersToPay = true;
    this.userClient.getUserToPay().subscribe({
      next: (response: any) => {
        console.log('Users to pay response:', response);
        let users = response?.data || [];
        console.log('Raw users data:', users);

        const balanceObservables = users.map((user: User) =>
          this.transactionClient.getBalanceByID(user.userId).pipe(
            map((balanceResponse: any) => {
              console.log(`Balance for user ${user.userId}:`, balanceResponse);
              return {
                ...user,
                balance: (balanceResponse?.data as number) || 0,
              };
            }),
            catchError((error) => {
              console.error(
                `Error getting balance for user ${user.userId}:`,
                error
              );
              return of({
                ...user,
                balance: 0,
              });
            })
          )
        );

        forkJoin(balanceObservables).subscribe((usersWithBalance) => {
          this.usersToPay = (usersWithBalance as User[]).filter(
            (u) => (u.balance || 0) > 0
          );
          console.log('Filtered users with balance:', this.usersToPay);

          this.filteredUsers = [...this.usersToPay];
          this.usersToPay.forEach((user) => {
            if (!user.amountDue) {
              user.amountDue = user.balance;
            }
            this.loadUserSubscriptions(user);
          });
          this.calculateTotalAmountDue();
          this.isFetchingUsersToPay = false;
        });
      },
      error: (error) => {
        console.error('Error loading users to pay:', error);
        this.usersToPay = [];
        this.filteredUsers = [];
        this.isFetchingUsersToPay = false;
        this.snackBar.open('Failed to load pending payments', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar',
        });
      },
    });
  }

  loadUserSubscriptions(user: User): void {
    if (!user?.userId) {
      console.warn('Invalid user passed to loadUserSubscriptions');
      return;
    }

    console.log(`Fetching subscriptions for user ${user.userId}`);

    this.subscriptionClient.getUserSubscription(user.userId).subscribe({
      next: (response: any) => {
        const subscriptions = (response?.data as SubscriptionDto[]) || [];
        console.log(`Subscriptions for user ${user.userId}:`, subscriptions);
        user.subscriptions = subscriptions;
        this.selectedUser = user;
        this.loadSubServiceNames();
      },
      error: (error) => {
        console.error(
          `Failed to fetch subscriptions for user ${user.userId}`,
          error
        );
        user.subscriptions = [];
      },
    });
  }

  selectUser(user: User): void {
    console.log('Selected user:', user);
    console.log('User subscriptions:', user.subscriptions);
    console.log('User subServiceNames:', user.subServiceNames);
    this.selectedUser = user;
    this.paymentForm.patchValue({
      amount: user.amountDue || user.balance || 0,
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

  updateUserAmount(user: User, amount: number): void {
    if (amount < 0) amount = 0;
    user.amountDue = amount;
    this.calculateTotalAmountDue();
  }

 loadSubServiceNames(): void {
  if (!this.selectedUser) return;

  // Initialize subscriptions if undefined
  if (!this.selectedUser.subscriptions) {
    this.selectedUser.subscriptions = [];
    return;
  }

  const uniqueServiceIds = [
    ...new Set(
      this.selectedUser.subscriptions
        .map(sub => sub.subServiceId)
        .filter((id): id is number => id !== undefined && id !== null)
    )
  ];

  forkJoin(
    uniqueServiceIds.map(id => 
      this.subServiceClient.getById(id).pipe(
        map(response => ({
          id,
          name: response.data?.subServiceName || `Unknown (${id})`
        })),
        catchError(() => of({
          id,
          name: `Service ${id}`
        }))
      )
    )
  ).subscribe(results => {
    // Update service names map
    results.forEach(result => {
      this.subServiceNames[result.id] = result.name;
    });

    // Properly map subscriptions with NSwag-compatible objects
    if (this.selectedUser?.subscriptions) {
      this.selectedUser.subscriptions = this.selectedUser.subscriptions.map(sub => {
        const newSub = new SubscriptionDto(); // Proper instantiation
        Object.assign(newSub, sub); // Copy all properties
        (newSub as any).serviceName = this.subServiceNames[sub.subServiceId!] || 'Unknown';
        return newSub;
      });
    }
  });
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
    receiptData.username =
      this.selectedUser.username || `user_${receiptData.userId}`;
    receiptData.roleId = this.selectedUser.roleId;
    receiptData.isActive = this.selectedUser.isActive;

    receiptData.credit = this.paymentForm.value.amount;
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
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
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

  async processBulkPayment(generateReceipt: boolean = false): Promise<void> {
    this.isProcessingPayment = true;

    try {
      const paymentPromises = this.selectedUsers.map((user) => {
        const paymentData = new TransactionDto({
          userId: user.userId,
          credit: user.amountDue || 0,
          debit: 0,
          tenantId: user.tenantId,
          createdAt: Math.floor(Date.now() / 1000),
        });
        return this.transactionClient.add(paymentData).toPromise();
      });

      const paymentResults = await Promise.all(paymentPromises);
      const transactions = paymentResults
        .map((res) => res?.data)
        .filter(Boolean);

      // Generate receipts if requested
      if (generateReceipt) {
        await this.generateBulkReceipts(this.selectedUsers, transactions);
      }

      this.snackBar.open(
        `Successfully processed ${this.selectedUsers.length} payments`,
        'Close',
        { duration: 5000, panelClass: 'success-snackbar' }
      );

      this.selectedUsers = [];
      this.loadUsersToPay();
    } catch (error) {
      console.error('Bulk payment processing failed:', error);
      let errorMessage = 'Unknown error';
      if (
        typeof error === 'object' &&
        error !== null &&
        'error' in error &&
        typeof (error as any).error === 'object' &&
        (error as any).error !== null &&
        'message' in (error as any).error
      ) {
        errorMessage = (error as any).error.message;
      }
      this.snackBar.open(
        'Payment processing failed: ' + errorMessage,
        'Close',
        { duration: 5000, panelClass: 'error-snackbar' }
      );
    } finally {
      this.isProcessingPayment = false;
    }
  }

  async generateBulkReceipts(
    users: User[],
    transactions: any[]
  ): Promise<void> {
    // Validate inputs
    if (!users || !transactions || users.length !== transactions.length) {
      this.snackBar.open('Users and transactions data mismatch', 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar',
      });
      return;
    }

    this.isProcessingPayment = true;
    const results: { success: boolean; name: string; error?: string }[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      try {
        const receiptData = new TransactionPaymentDto();
        receiptData.transactionId = transactions[i].transactionId;
        receiptData.username = user.username;
        receiptData.userId = user.userId;
        receiptData.name = user.name;
        receiptData.phoneNumber = user.phoneNumber;
        receiptData.email = user.email || '';
        receiptData.createdAt = Math.floor(Date.now() / 1000);
        receiptData.tenantId = user.tenantId;
        receiptData.credit = user.amountDue || 0;
        receiptData.debit = 0;
        receiptData.subscriptions = user.subscriptions || [];

        // Add small delay between requests (100ms)
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const response = await this.transactionClient
          .generateReceipt(receiptData)
          .toPromise();

        if (response) {
          const blob = new Blob([response.data], { type: response.data.type });
          const url = window.URL.createObjectURL(blob);

          // Open PDF in new window
          window.open(url, '_blank');

          // Also provide download option
          saveAs(
            blob,
            `Receipt_${user.userId}_${receiptData.transactionId}.pdf`
          );

          results.push({ success: true, name: user.name });
        } else {
          throw new Error('Empty response from server');
        }
      } catch (error) {
        console.error(
          `Failed to generate receipt for user ${user.userId}:`,
          error
        );
        results.push({
          success: false,
          name: user.name,
        });
      }
    }

    this.isProcessingPayment = false;

    // Show summary of results
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    if (failed.length > 0) {
      const failedNames = failed
        .map((f) => `${f.name} (${f.error})`)
        .join(', ');
      this.snackBar.open(
        `Generated ${successful} receipts, failed for: ${failedNames}`,
        'Close',
        { duration: 10000, panelClass: 'warning-snackbar' }
      );
    } else {
      this.snackBar.open(
        `Successfully generated ${successful} receipts`,
        'Close',
        { duration: 5000, panelClass: 'success-snackbar' }
      );
    }
  }
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
        await this.processBulkPayment(result.generateReceipt);
      }
    });
  }
  searchUsers(): void {
    const searchTerm = this.searchForm.get('searchTerm')?.value?.toLowerCase();
    if (!searchTerm) {
      this.filteredUsers = [...this.usersToPay];
      this.isSearching = false;
      return;
    }

    this.isSearching = true;
    this.filteredUsers = this.usersToPay.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm) ||
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.phoneNumber && user.phoneNumber.toString().includes(searchTerm))
    );
  }

  clearSearch(): void {
    this.searchForm.get('searchTerm')?.setValue('');
    this.filteredUsers = [...this.usersToPay];
    this.isSearching = false;
  }
}
