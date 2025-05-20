import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewChild,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatSpinner } from '@angular/material/progress-spinner';
import {
  MatTable,
  MatHeaderCell,
  MatCell,
  MatColumnDef,
  MatHeaderRow,
  MatRow,
  MatCellDef,
  MatHeaderCellDef,
  MatHeaderRowDef,
  MatRowDef,
} from '@angular/material/table';
import { MatSortModule, MatSortHeader } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import {
  MatFormFieldControl,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import {
  CrudTableConfig,
  ColumnConfig,
} from '../../data/menu/reusableCrudData';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription, tap } from 'rxjs';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-reusable-crud',
  imports: [
    CommonModule,
    MatIcon,
    MatSpinner,
    MatTable,
    MatHeaderCell,
    MatCell,
    MatColumnDef,
    MatHeaderRow,
    MatRow,
    MatSortModule,
    MatSortHeader,
    MatPaginator,
    MatHeaderRowDef,
    MatRowDef,
    MatHeaderCellDef,
    MatCellDef,
    MatFormFieldModule,
    MatChipsModule,
    ReactiveFormsModule,
    MatInputModule,
  ],
  templateUrl: './reusable-crud.component.html',
  styleUrl: './reusable-crud.component.scss',
})
export class ReusableCrudComponent<T> implements OnInit {
  @Input() config!: CrudTableConfig<T>;
  @Input() isLoading = false;
  @Input() showSearch = true;
  @Input() searchPlaceholder = 'Search...';
  @Input() minSearchLength = 3;
  @Input() rowActionsTemplate?: TemplateRef<any>;
  @Input() columnTemplates: { [key: string]: TemplateRef<any> } = {};
  @Input() showRowPointer = true;
  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();
  @Output() refresh = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() search = new EventEmitter<string>();
  @Input() set searchTerm(value: string) {
    if (value !== this.searchControl.value) {
      this.searchControl.setValue(value, { emitEvent: false });
    }
  }
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private searchSubscription?: Subscription;
  isSearching = false;
  searchControl = new FormControl('');

  ngOnInit(): void {
    this.setupSearch();
    this.validateConfig();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.validateConfig();
    }
  }

  private setupSearch(): void {
    this.searchSubscription = this.searchControl.valueChanges
      .pipe(
        tap(() => (this.isSearching = true)),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.isSearching = false))
      )
      .subscribe((term) => {
        if ((term && term.length >= this.minSearchLength) || term === '') {
          this.search.emit(term || '');
        }
      });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.search.emit('');
  }

  private validateConfig(): void {
    if (!this.config) {
      console.error('Config is required for ReusableCrudComponent');
      this.config = {
        title: 'Data Table',
        columns: [],
        dataSource: [],
        pageSizeOptions: [10],
        defaultPageSize: 10,
        pageSize: 10,
        totalItems: 0,
        numeric: 10,
      };
    }

    this.config.columns ??= [];
    this.config.dataSource ??= [];
    this.config.pageSize ??= 10;
    this.config.pageSizeOptions ??= [5, 10, 25, 100];
    this.config.totalItems ??= this.config.dataSource.length;
  }

  get displayedColumns(): string[] {
    const cols = this.config.columns.map((c) => c.name);
    if (this.rowActionsTemplate) {
      cols.push('actions');
    }
    return cols;
  }

  getCellValue(row: any, column: ColumnConfig): any {
    const value = column.propertyPath
      ? this.getNestedProperty(row, column.propertyPath)
      : row[column.name];

    return column.transform ? column.transform(value) : value;
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  }

  onRowClick(row: T): void {
    if (this.showRowPointer) {
      this.rowClick.emit(row);
    }
  }

  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  handlePageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
