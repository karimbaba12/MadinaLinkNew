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
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'space_dashboard',
    url: '/dashboard',
    type: 'item',
    color: 'text-indigo-500',
  },
  {
    id: 'management',
    title: 'Management',
    icon: 'settings',
    type: 'group',
    color: 'text-blue-500',
    children: [
      {
        id: 'usermanagement',
        title: 'Users',
        icon: 'people',
        url: 'userManagement',
        type: 'item',
        color: 'text-blue-400',
      },
      {
        id: 'subServiceManagement',
        title: 'Services',
        icon: 'miscellaneous_services',
        url: 'SubServiceManagement',
        type: 'item',
        color: 'text-blue-400',
      },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    icon: 'work',
    type: 'group',
    color: 'text-green-500',
    children: [
      {
        id: 'userService',
        title: 'User Services',
        icon: 'assignment_ind',
        url: 'Service',
        type: 'item',
        color: 'text-green-400',
      },
      {
        id: 'counter',
        title: 'Counters',
        icon: 'pin',
        url: 'counter',
        type: 'item',
        color: 'text-green-400',
      },
    ],
  },
  {
    id: 'payment',
    title: 'Payments',
    icon: 'work',
    type: 'group',
    color: 'text-green-500',
    children: [
      {
        id: 'payment',
        title: 'Payments',
        icon: 'payment',
        url: 'PaymentManagement',
        type: 'item',
        color: 'text-green-400',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: 'assessment',
    url: 'reports',
    type: 'item',
    color: 'text-purple-500',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'tune',
    url: 'settings',
    type: 'item',
    color: 'text-gray-500',
  },
];

export const SuperadminMenus: Navigation[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'space_dashboard',
    url: '/dashboard',
    type: 'item',
    color: 'text-indigo-500',
  },
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
];
