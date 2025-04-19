import { Routes } from '@angular/router';
import { LoginComponent } from '../Pages/Auth/login/login.component';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { AdminComponent } from '../Pages/admin/admin/admin.component';
import { AuthGuard } from '../../guards/auth.guard';
import { ElectricityComponent } from '../components/Services/electricity/electricity.component';
import { UsermanagementComponent } from '../components/usermanagement/usermanagement.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'electricity',
        component: ElectricityComponent,
      },
      {
        path: 'userManagement',
        component: UsermanagementComponent,
      },
    ],
  },
  //       {
  //         path: 'CrudOperation',
  //         component: CrudOperationComponent,
  //       },
  //       {
  //         path: 'electricity',
  //         component: electricityCrudComponent,
  //       },
  //       {
  //         path: 'crudByRole',
  //         component: CrudbyRoleComponent,
  //       },
  //     ],
  //   },

  { path: '', redirectTo: '/admin/dashboard', pathMatch: 'full' },

  { path: '**', redirectTo: '/admin/dashboard' },
];
