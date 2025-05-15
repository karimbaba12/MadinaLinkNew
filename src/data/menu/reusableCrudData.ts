export interface ColumnConfig<T = any> {
  name: string;
  header: string;
  sortable?: boolean;
  displayFn?: (value: any, row?: T) => string | number | boolean;
  width?: string;
  id?: string;
  formatter?: (value: any) => string;
  numeric?: boolean;
  propertyPath?: string;
  transform?: (value: any) => string | number | boolean;
}

export interface CrudTableConfig<T = any> {
  title?: string;
  numeric: number;
  subtitle?: string;
  columns: ColumnConfig<T>[];
  dataSource: T[];
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  pageSize: number;
  totalItems :number;
}
