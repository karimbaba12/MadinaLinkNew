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
import { AllUsersWithServiceComponent } from '../components/all-users-with-service/all-users-with-service.component';
import { CounterComponent } from '../components/counter/counter.component';
import { TransactionHistoryComponentComponent } from '../components/transaction-history-component/transaction-history-component.component';
import { UnauthorizedComponent } from '../Pages/Auth/unauthorized/unauthorized.component';
import { CounterHistoryComponent } from '../components/counter-history/counter-history.component';
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'electricity', component: ElectricityComponent },
      { path: 'userManagement', component: UsermanagementComponent },
      { path: 'addTenant', component: AddTenantComponent },
      { path: 'updateTenant', component: UpdateTenantComponent },
      {
        path: 'SubServiceManagement',
        component: SubserviceManagementComponent,
      },
      { path: 'PaymentManagement', component: PaymentComponent },
      { path: 'Service', component: AllUsersWithServiceComponent },
      { path: 'counter', component: CounterComponent },
      { path: 'counterHistory', component: CounterHistoryComponent },
      { path: 'transactions', component: TransactionHistoryComponentComponent },
      {
        path: '**',
        redirectTo: 'admin/dashboard',
      },
      {
        path: '',
        redirectTo: 'admin/dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
