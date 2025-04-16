export interface NavigationItem {
  id: string;
  title: string;
  icon?: string;
  link?: string;
  url?: string;
  breadcrumbs?: boolean;
  children?: Navigation[];
  type: 'item' | 'group' | 'collapse';
  action?: string;
}

export interface Navigation extends NavigationItem {
  children?: NavigationItem[];
}
