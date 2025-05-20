import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import {
  MatCellDef,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRowDef,
  MatTableDataSource,
} from '@angular/material/table';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
} from 'rxjs';
import {
  TransactionDto,
  UserDto,
  TransactionClient,
  UsersClient,
} from '../../../Services/api/api-client.service';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import {
  MatFormField,
  MatFormFieldControl,
  MatFormFieldModule,
  MatLabel,
} from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { TransactionEditDialogComponent } from '../../dialogs/transaction-edit-dialog-component/transaction-edit-dialog.component';
import { DeleteTransactionComponent } from '../../dialogs/transactions/delete-transaction/delete-transaction.component';
import { TransactionActionsComponent } from '../../dialogs/transactions/transaction-actions/transaction-actions.component';
import { AuthService } from '../../../Services/Auth/auth.service';
@Component({
  selector: 'app-transaction-history-component',
  imports: [
    MatCard,
    MatInputModule,
    MatTableModule,
    MatCardHeader,
    MatPaginatorModule,
    MatCardContent,
    MatSortModule,
    MatCardTitle,
    MatCardActions,
    MatFormField,
    MatLabel,
    MatIcon,
    ReactiveFormsModule,
    CommonModule,
    MatPaginator,
    MatProgressSpinner,
    MatCellDef,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRowDef,
    MatFormFieldModule,
    TransactionActionsComponent,
  ],
  templateUrl: './transaction-history-component.component.html',
  styleUrl: './transaction-history-component.component.scss',
})
export class TransactionHistoryComponentComponent {
  displayedColumns: string[] = [
    'transactionId',
    'userName',
    'credit',
    'debit',
    'createdAt',
    'actions',
  ];
  dataSource!: MatTableDataSource<TransactionDto>;
  searchControl = new FormControl();
  isLoading = false;
  showDailyOnly = true;

  userNameMap: Record<number, Observable<string>> = {};
  // Summary data
  dailyCount: number | undefined = undefined;
  monthlyCount: number | undefined = undefined;
  dailyProfit: number | undefined = undefined;

  // Users cache
  usersCache: { [key: string]: UserDto | undefined } = {};

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  constructor(
    private transactionClient: TransactionClient,
    private userClient: UsersClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSummaryData();
    this.loadTransactions();

    // Setup search
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.paginator.firstPage();
        this.applyFilter();
      });
  }

  loadSummaryData(): void {
    this.transactionClient.getDailyTransactionCount().subscribe((count) => {
      this.dailyCount = count.data ?? 0;
    });

    this.transactionClient.getMonthlyTransactionNumber().subscribe((count) => {
      this.monthlyCount = count.data ?? 0;
    });

    this.transactionClient.getDailyDebit().subscribe((profit) => {
      this.dailyProfit = profit.data ?? 0;
    });
  }

  loadTransactions(): void {
    this.isLoading = true;

    const transactionObservable = this.showDailyOnly
      ? this.transactionClient.getDailyTransaction()
      : this.transactionClient.getAll();

    transactionObservable.subscribe(
      (response) => {
        const transactions = response.data || [];
        this.processTransactions(transactions);
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading transactions', error);
        this.isLoading = false;
      }
    );
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchControl.value?.trim() || '';
  }

  toggleView(): void {
    this.showDailyOnly = !this.showDailyOnly;
    this.loadTransactions();
  }
  private processTransactions(transactions: TransactionDto[]): void {
    console.log('Processing transactions:', transactions.length);
    this.dataSource = new MatTableDataSource(transactions);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (
      data: TransactionDto,
      filter: string
    ) => {
      const user = this.usersCache[data.userId ?? 0];
      const userName = user
        ? `${user.username ?? user.name ?? ''}`.toLowerCase()
        : '';
      console.debug(
        `Filtering - userId: ${data.userId}, userName: ${userName}`
      );
      return userName.includes(filter.toLowerCase());
    };

    const userIds = [
      ...new Set(
        transactions
          .map((t) => t.userId)
          .filter((id): id is number => id !== undefined)
      ),
    ];
    console.log('Unique userIds to load:', userIds);

    userIds.forEach((userId) => {
      if (!this.usersCache[userId]) {
        console.log(`Loading user ${userId} from API`);
        this.userClient.getById(userId).subscribe({
          next: (response) => {
            if (response.data) {
              // console.log(`User ${userId} loaded successfully`);
              this.usersCache[userId] = response.data;
              this.dataSource.data = [...this.dataSource.data];
            } else {
              console.warn(`User ${userId} data not found in response`);
              this.usersCache[userId] = undefined;
            }
          },
          error: (err) => {
            console.error(`Error loading user ${userId}:`, err);
            this.usersCache[userId] = undefined;
          },
        });
      } else {
        console.debug(`User ${userId} already in cache`);
      }
    });
  }

  getUserName(userId: number | undefined): Observable<string> {
    if (userId == null) {
      console.debug('Null userId provided');
      return of('Unknown');
    }

    const cachedUser = this.usersCache[userId];
    if (cachedUser) {
      // console.debug(`Using cached user ${userId}`);
      return of(cachedUser.username || cachedUser.name || 'Unknown');
    }

    // console.log(`Fetching user ${userId} for username`);
    return this.userClient.getById(userId).pipe(
      map((response) => {
        const user = response.data;
        if (user) {
          // console.log(`User ${userId} fetched successfully`);
          this.usersCache[userId] = user;
          return user.username || user.name || 'Unknown';
        }
        console.warn(`User ${userId} data not found`);
        return 'Unknown';
      }),
      startWith('Loading...'),
      catchError((err) => {
        console.error(`Error fetching user ${userId}:`, err);
        return of('Error loading user');
      }),
      shareReplay(1) // Cache the observable
    );
  }

  handleEdit(transaction: TransactionDto): void {
    const dialogRef = this.dialog.open(TransactionEditDialogComponent, {
      width: '500px',
      data: { ...transaction },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.transactionClient.update(result).subscribe({
          next: () => {
            this.showSuccess('Transaction updated successfully');
            this.loadTransactions();
            this.loadSummaryData();
          },
          error: () => this.showError('Error updating transaction'),
        });
      }
    });
  }

  handleDelete(transactionId: number): void {
    this.authService.getUserRoleName().then((role) => {
      if (role === 'User') {
        this.snackBar.open(
          'You do not have permission to delete transactions',
          'Close',
          {
            duration: 3000,
            panelClass: ['error-snackbar'],
          }
        );
        return;
      }
      const dialogRef = this.dialog.open(DeleteTransactionComponent, {
        width: '350px',
        data: {
          title: 'Confirm Delete',
          message: 'Are you sure you want to delete this transaction?',
        },
      });

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.transactionClient.deleteById(transactionId).subscribe({
            next: () => {
              this.showSuccess('Transaction deleted successfully');
              this.loadTransactions();
              this.loadSummaryData();
            },
            error: () => this.showError('Error deleting transaction'),
          });
        }
      });
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar'],
    });
  }
  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  formatCurrency(amount: number): string {
    return amount.toFixed(2);
  }
}
