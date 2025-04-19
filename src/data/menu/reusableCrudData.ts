export interface ColumnConfig<T = any> {
  name: string;
  header: string;
  sortable?: boolean;
  displayFn?: (value: any, row?: T) => string | number | boolean;
  width?: string;
  id?: string;
  formatter?: (value: any) => string;
}

export interface CrudTableConfig<T = any> {
  title?: string;
  columns: ColumnConfig<T>[];
  dataSource: T[];
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  
}
