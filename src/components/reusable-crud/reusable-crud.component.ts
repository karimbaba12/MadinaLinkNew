import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewChild,
  OnInit,
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

@Component({
  selector: 'app-reusable-crud',
  imports: [
    CommonModule,
    MatToolbar,
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
  ],
  templateUrl: './reusable-crud.component.html',
  styleUrl: './reusable-crud.component.scss',
})
export class ReusableCrudComponent<T> implements OnInit {
  onRowClick(_t71: any) {
    throw new Error('Method not implemented.');
  }
  @Input() config!: CrudTableConfig<T>;
  @Input() isLoading = false;

  @Input() rowActionsTemplate?: TemplateRef<any>;
  @Input() columnTemplates: { [key: string]: TemplateRef<any> } = {};

  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();
  @Output() refresh = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @Input() showFilter: boolean = true;
  @Output() filterChange = new EventEmitter<string>();

  applyFilter(filterValue: string) {
    this.filterChange.emit(filterValue);
  }
  ngOnInit() {
    console.log('ReusableCrudComponent initialized with config:', this.config);
    this.validateConfig();
  }

  get displayedColumns(): string[] {
    const cols = this.config.columns.map((c) => c.name);
    if (this.rowActionsTemplate) {
      cols.push('actions');
    }
    // console.log('Displayed columns:', cols);
    return cols;
  }

  getColumnId(column: ColumnConfig): string {
    // Return a guaranteed non-empty string
    if (column.id && typeof column.id === 'string') return column.id;
    if (column.name && typeof column.name === 'string') return column.name;
    if (column.header && typeof column.header === 'string')
      return column.header;
    // Fallback to random string if all else fails
    return `col-${Math.random().toString(36).substr(2, 5)}`;
  }
  private validateConfig(): void {
    if (!this.config) {
      console.error('Config is required for ReusableCrudComponent');
      this.config = {
        title: 'Error: No Config',
        columns: [],
        dataSource: [],
      };
      return;
    }

    if (!Array.isArray(this.config.columns)) {
      console.error('Columns must be an array');
      this.config.columns = [];
    }

    if (!Array.isArray(this.config.dataSource)) {
      console.error('DataSource must be an array');
      this.config.dataSource = [];
    }
  }

  getCellValue(row: any, column: any): any {
    const value = row[column.name];
    return column.transform ? column.transform(value) : value;
  }

  private formatValue(value: any): string | number | boolean {
    if (value === undefined || value === null) {
      return '';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (value instanceof Date) {
      try {
        return value.toLocaleDateString();
      } catch (e) {
        console.error('Error formatting date:', e);
        return '';
      }
    }

    return value;
  }
  onSortChange(sort: Sort): void {
    console.log('Sort changed:', sort);
    this.sortChange.emit(sort);
  }

  handlePageChange(event: PageEvent): void {
    console.log('Page changed:', event);
    this.pageChange.emit(event);
  }
}
