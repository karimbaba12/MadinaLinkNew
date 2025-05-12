import { Routes } from '@angular/router';
import { LoginComponent } from '../Pages/Auth/login/login.component';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { AdminComponent } from '../Pages/admin/admin/admin.component';
import { AuthGuard } from '../../guards/auth.guard';
import { ElectricityComponent } from '../components/Services/electricity/electricity.component';
import { UsermanagementComponent } from '../components/usermanagement/usermanagement.component';
import { AddTenantComponent } from '../components/Tenancy/add-tenant/add-tenant.component';
import { UpdateTenantComponent } from '../components/Tenancy/update-tenant/update-tenant.component';
import { SubserviceManagementComponent } from '../components/SubServices/subservice-management/subservice-management.component';
import { PaymentComponent } from '../components/payment/payment.component';

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
      {
        path: 'addTenant',
        component: AddTenantComponent,
      },
      {
        path: 'updateTenant',
        component: UpdateTenantComponent,
      },
      {
        path: 'SubServiceManagement',
        component: SubserviceManagementComponent,
      },
      {
        path: 'PaymentManagement',
        component: PaymentComponent,
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
