import { Navigation } from './Navigation';

export const UserMenus: Navigation[] = [
  {
    id: 'user-group',
    title: 'User Menu',
    type: 'group',
    icon: 'person',
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'speed',
        url: 'dashboard',
        type: 'item',
      },
      {
        id: 'profile',
        title: 'My Profile',
        icon: 'account_circle',
        url: 'profile',
        type: 'item',
      },
      {
        id: 'electricity',
        title: 'Electricity',
        icon: 'bolt',
        url: '/admin/electricity',
        type: 'item',
      },
      {
        id: 'support',
        title: 'Support',
        icon: 'help_center',
        url: '/support',
        type: 'item',
      },
    ],
  },
];

export const AdminMenus: Navigation[] = [
  {
    id: 'admin-group',
    title: 'Admin Menu',
    type: 'group',
    icon: 'admin_panel_settings',
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'dashboard',
        url: '/dashboard',
        type: 'item',
      },
      {
        id: 'usermanagement',
        title: 'User Management',
        icon: 'group',
        url: 'userManagement',
        type: 'item',
      },
      {
        id: 'management',
        title: 'Management',
        icon: 'tune',
        type: 'collapse',
        children: [
          {
            id: 'users',
            title: 'Users',
            icon: 'people',
            url: '/management/users',
            type: 'item',
          },
          {
            id: 'roles',
            title: 'Roles',
            icon: 'lock',
            url: '/management/roles',
            type: 'item',
          },
        ],
      },
    ],
  },
];

export const SuperadminMenus: Navigation[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
    url: '/dashboard',
    type: 'item',
  },
  {
    id: 'superadmin-group',
    title: 'Admin Tools',
    type: 'group',
    icon: 'build',
    children: [
      {
        id: 'usermanagement',
        title: 'User Management',
        icon: 'manage_accounts',
        url: 'userManagement',
        type: 'item',
      },
      {
        id: 'subServiceManagement',
        title: 'Services',
        icon: 'widgets',
        url: 'SubServiceManagement',
        type: 'item',
      },
    ],
  },
  {
    id: 'tenant-group',
    title: 'Tenant Management',
    type: 'group',
    icon: 'apartment',
    children: [
      {
        id: 'allTenant',
        title: 'All Tenants',
        icon: 'list',
        url: '/admin/updateTenant',
        type: 'item',
      },
      {
        id: 'addTenant',
        title: 'Add Tenant',
        icon: 'add',
        url: '/admin/addTenant',
        type: 'item',
      },
    ],
  },
];
