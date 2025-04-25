import { Navigation } from './Navigation';

export const UserMenus: Navigation[] = [
  {
    id: 'user-group',
    title: 'User Menu',
    type: 'group',
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'dashboard',
        url: 'dashboard',
        type: 'item',
      },
      {
        id: 'usermanagement',
        title: 'Usermanagement',
        icon: 'bar_chart',
        url: 'userManagement',
        type: 'item',
      },
      {
        id: 'electricity',
        title: 'electricity',
        icon: 'person',
        url: '/admin/electricity',
        type: 'item',
      },
      {
        id: 'support',
        title: 'Support',
        icon: 'support',
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
        title: 'Usermanagement',
        icon: 'bar_chart',
        url: 'userManagement',
        type: 'item',
      },
      {
        id: 'management',
        title: 'Management',
        icon: 'settings',
        type: 'collapse',
        children: [
          {
            id: 'users',
            title: 'Users',
            icon: 'group',
            url: '/management/users',
            type: 'item',
          },
          {
            id: 'roles',
            title: 'Roles',
            icon: 'security',
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
    id: 'superadmin-group',
    title: 'Superadmin Menu',
    type: 'group',
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
        title: 'Usermanagement',
        icon: 'bar_chart',
        url: 'userManagement',
        type: 'item',
      },
      {
        id: 'system',
        title: 'System Settings',
        icon: 'build',
        type: 'collapse',
        children: [
          {
            id: 'config',
            title: 'Configuration',
            icon: 'tune',
            url: '/system/configuration',
            type: 'item',
          },
          {
            id: 'logs',
            title: 'System Logs',
            icon: 'history',
            url: '/system/logs',
            type: 'item',
          },
        ],
      },
      {
        id: 'admin-management',
        title: 'Admin Management',
        icon: 'admin_panel_settings',
        type: 'collapse',
        children: [
          {
            id: 'manage-admins',
            title: 'Manage Admins',
            icon: 'manage_accounts',
            url: '/superadmin/admins',
            type: 'item',
          },
          {
            id: 'audit-trail',
            title: 'Audit Trail',
            icon: 'timeline',
            url: '/superadmin/audit',
            type: 'item',
          },
        ],
      },
      {
        id: 'analytics',
        title: 'Advanced Analytics',
        icon: 'insights',
        url: '/analytics',
        type: 'item',
      },
    ],
  },
];
