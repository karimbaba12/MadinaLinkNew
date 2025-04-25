// import { Component, OnInit } from '@angular/core';
// import { finalize } from 'rxjs/operators';
// import { forkJoin } from 'rxjs';
// import { CommonModule } from '@angular/common';
// import { MatIcon } from '@angular/material/icon';
// import { PageEvent } from '@angular/material/paginator';
// import { Sort } from '@angular/material/sort';

// import { MatDialog } from '@angular/material/dialog';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { ReusableCrudComponent } from '../../reusable-crud/reusable-crud.component';
// import {
//   PaymentClient,
//   PaymentMethodClient,
//   ServiceClient,
//   SubscriptionClient,
//   SubscriptionTypeClient,
//   SubServiceClient,
//   UsersClient,
// } from '../../../../Services/api/api-client.service';
// import { DateFormatService } from '../../../../Services/dateFormate/date-format.service';
// import { CrudTableConfig } from '../../../data/menu/reusableCrudData';
// import { AuthService } from '../../../../Services/Auth/auth.service';

// interface CombinedServiceData {
//   userId: number;
//   userName: string;
//   serviceName: string;
//   subscriptionType: string;
//   subServiceCode: string;
//   paymentMethod: string;
//   startDate: string;
//   endDate: string;
//   discount: number;
//   status: string;
//   serviceId: number;
//   rawData: any;
// }
// @Component({
//   selector: 'app-electricity',
//   imports: [
//     CommonModule,
//     ReusableCrudComponent,
//     MatIcon,
//     MatInputModule,
//     MatFormFieldModule,
//   ],
//   templateUrl: './electricity.component.html',
//   styleUrl: './electricity.component.scss',
// })
// export class ElectricityComponent implements OnInit {
//   loading = false;
//   combinedData: CombinedServiceData[] = [];
//   UserId: number = 0;
//   electricityServiceId = 1;
//   servicesConfig: CrudTableConfig<CombinedServiceData> = {
//     title: 'User Services Management',
//     columns: [
//       { name: 'userName', header: 'Username', sortable: true },
//       { name: 'serviceName', header: 'Service', sortable: true },
//       { name: 'subscriptionType', header: 'Type' },
//       { name: 'subServiceCode', header: 'Subservice' },
//       { name: 'paymentMethod', header: 'Payment Method' },
//       {
//         name: 'startDate',
//         header: 'Start Date',
//       },
//       {
//         name: 'endDate',
//         header: 'End Date',
//       },
//       { name: 'discount', header: 'Discount(%)' },
//       {
//         name: 'status',
//         header: 'Status',
//       },
//     ],
//     dataSource: this.combinedData,
//   };

//   constructor(
//     private serviceClient: ServiceClient,
//     private subscriptionClient: SubscriptionClient,
//     private subServiceClient: SubServiceClient,
//     private paymentClient: PaymentClient,
//     private subscriptionTypeClient: SubscriptionTypeClient,
//     private userClient: UsersClient,
//     private paymentMethodClient: PaymentMethodClient,
//     private dateFormatService: DateFormatService,
//     private dialog: MatDialog,
//     private authService: AuthService
//   ) {}

//   ngOnInit(): void {
//     this.loadCombinedData();
//     const userId = this.authService.getUserId();
//     if (userId !== null && userId !== undefined) {
//       console.log('User ID:', userId);
//       this.UserId = userId;
//     }
//   }

//   getFormattedDate(unixTimestamp: number): string {
//     return this.dateFormatService.unixToDateString(unixTimestamp);
//   }

//   loadCombinedData(): void {
//     this.loading = true;

//     forkJoin({
//       users: this.userClient.getAll(),
//       services: this.serviceClient.getAll(),
//       subscriptions: this.subscriptionClient.getAll(),
//       subServices: this.subServiceClient.getAll(),
//       paymentMethods: this.paymentMethodClient.getAll(),
//       subscriptionTypes: this.subscriptionTypeClient.getAll(),
//     })
//       .pipe(finalize(() => (this.loading = false)))
//       .subscribe({
//         next: (responses) => {
//           this.combinedData = this.combineData(
//             responses.users.data || [],
//             responses.services.data || [],
//             responses.subscriptions.data || [],
//             responses.subServices.data || [],
//             responses.paymentMethods.data || [],
//             responses.subscriptionTypes.data || []
//           );

//           this.servicesConfig.dataSource = [...this.combinedData];
//         },
//         error: (err) => {
//           console.error('Error loading data:', err);
//         },
//       });
//   }

//   private combineData(
//     users: any[],
//     services: any[],
//     subscriptions: any[],
//     subServices: any[],
//     paymentMethods: any[],
//     subscriptionTypes: any[]
//   ): CombinedServiceData[] {
//     const result: CombinedServiceData[] = [];

//     subscriptions.forEach((subscription) => {
//       const user = users.find((u) => u.userId === subscription.userId);
//       const subService = subServices.find(
//         (ss) => ss.subServiceId === subscription.subServiceId
//       );
//       const service = services.find(
//         (s) => subService && s.serviceId === subService.serviceId
//       );
//       const paymentMethod = paymentMethods.find(
//         (pm) => pm.id === subscription.paymentMethodId
//       );
//       const subscriptionType = subscriptionTypes.find(
//         (st) =>
//           subService && st.subscriptionTypeId === subService.subscriptionTypeId
//       );
//       //console.log('payment method:', paymentMethod);
//       if (user && service && subService) {
//         if (service.serviceId === this.electricityServiceId) {
//           result.push({
//             userId: user.userId,
//             userName: user.name,
//             serviceName: service.serviceCode,
//             subscriptionType: subscriptionType?.subscriptionTypeName || 'N/A',
//             subServiceCode: subService.subServiceCode,
//             paymentMethod: paymentMethod?.paymentMethodName || 'N/A',
//             startDate: this.getFormattedDate(subscription.startDate),
//             endDate: this.getFormattedDate(subscription.endDate),
//             discount: subscription.discount || 0,
//             status: subscription.isActive ? 'Active' : 'Inactive',
//             serviceId: service.serviceId,
//             rawData: {
//               user,
//               service,
//               subscription,
//               subService,
//               paymentMethod,
//               subscriptionType,
//             },
//           });
//         }
//       }
//     });

//     return result;
//   }

//   // onAdd(): void {
//   //   const dialogRef = this.dialog.open(AddComponent, {
//   //     width: '800px', // Adjust width as needed
//   //     maxHeight: '90vh', // Adjust height as needed
//   //     disableClose: true, // Prevent closing by clicking outside
//   //     data: {}, // You can pass initial data here if needed
//   //   });

//   //   dialogRef.afterClosed().subscribe((result) => {
//   //     if (result) {
//   //       // Handle the result if the dialog was closed with data
//   //       console.log('Dialog closed with result:', result);
//   //       // You might want to refresh your data here
//   //     }
//   //   });
//   // }

//   onEdit(item: CombinedServiceData): void {
//     console.log('Edit item:', item);
//   }

//   onDelete(item: CombinedServiceData): void {
//     console.log('Delete item:', item);
//     this.subscriptionClient
//       .deleteById(item.rawData.subscription.subscriptionId)
//       .subscribe({
//         next: () => this.loadCombinedData(),
//         error: (err) => console.error('Delete failed:', err),
//       });
//   }

//   onRefresh(): void {
//     this.loadCombinedData();
//   }
//   onPageChange(event: PageEvent): void {
//     console.log('Page changed:', event);
//     // Add your pagination logic here, e.g.:
//     // this.currentPage = event.pageIndex;
//     // this.pageSize = event.pageSize;
//     // this.loadCombinedData();
//   }

//   onSortChange(sort: Sort): void {
//     console.log('Sort changed:', sort);
//     // Add your sorting logic here, e.g.:
//     // this.currentSort = sort;
//     // this.loadCombinedData();
//   }
// }
import { Component, Input, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReusableCrudComponent } from '../../reusable-crud/reusable-crud.component';
import {
  ServiceClient,
  SubscriptionClient,
  SubServiceClient,
  UsersClient,
  SubscriptionTypeClient,
  PaymentMethodClient,
} from '../../../../Services/api/api-client.service';
import { DateFormatService } from '../../../../Services/dateFormate/date-format.service';
import { CrudTableConfig } from '../../../data/menu/reusableCrudData';
import { AuthService } from '../../../../Services/Auth/auth.service';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

interface CombinedServiceData {
  userId: number;
  userName: string;
  serviceName: string;
  subscriptionType: string;
  subServiceCode: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  discount: number;
  status: string;
  serviceId: number;
  rawData: any;
}

@Component({
  selector: 'app-electricity',
  imports: [
    CommonModule,
    ReusableCrudComponent,
    MatIcon,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './electricity.component.html',
  styleUrls: ['./electricity.component.scss'],
  standalone: true,
})
export class ElectricityComponent implements OnInit {
  @Input() tenantId!: number;
  loading = false;
  combinedData: CombinedServiceData[] = [];
  userId: number = 0;
  electricityServiceId = 1;

  servicesConfig: CrudTableConfig<CombinedServiceData> = {
    title: 'Electricity Services Management',
    columns: [
      { name: 'userName', header: 'Username', sortable: true },
      { name: 'serviceName', header: 'Service', sortable: true },
      { name: 'subscriptionType', header: 'Sub Type' },
      { name: 'subServiceCode', header: 'Subservice' },
      { name: 'paymentMethod', header: 'Payment Method' },
      { name: 'startDate', header: 'Start Date' },
      { name: 'endDate', header: 'End Date' },
      { name: 'discount', header: 'Discount(%)' },
      { name: 'status', header: 'Status' },
    ],
    dataSource: this.combinedData,
  };

  constructor(
    private serviceClient: ServiceClient,

    private subscriptionClient: SubscriptionClient,
    private subServiceClient: SubServiceClient,
    private subscriptionTypeClient: SubscriptionTypeClient,
    private userClient: UsersClient,
    private paymentMethodClient: PaymentMethodClient,
    private dateFormatService: DateFormatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId() || 0;
    this.loadCombinedData();
  }

  private fetchAllData() {
    return forkJoin({
      users: this.userClient.getAll(),
      services: this.serviceClient.getAll(),
      subscriptions: this.subscriptionClient.getAll(),
      subServices: this.subServiceClient.getAll(),
      paymentMethods: this.paymentMethodClient.getAll(),
      subscriptionTypes: this.subscriptionTypeClient.getAll(),
    });
  }

  loadCombinedData(): void {
    this.loading = true;

    this.fetchAllData()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (responses) => {
          console.log('API Responses:', responses);
          this.combinedData = this.processData(
            responses.users.data || [],
            responses.services.data || [],
            responses.subscriptions.data || [],
            responses.subServices.data || [],
            responses.paymentMethods.data || [],
            responses.subscriptionTypes.data || []
          );
          this.servicesConfig.dataSource = [...this.combinedData];
          console.log(responses.users.data);
          console.log(responses.services.data);
          console.log(responses.subscriptions.data);
          console.log(responses.subServices.data);
          console.log(responses.paymentMethods.data);
          console.log(responses.subscriptionTypes.data);
        },
        error: (err) => {
          console.error('Error loading data:', err);
        },
      });
  }

  private processData(
    users: any[],
    services: any[],
    subscriptions: any[],
    subServices: any[],
    paymentMethods: any[],
    subscriptionTypes: any[]
  ): CombinedServiceData[] {
    return subscriptions
      .map((subscription) => {
        const user = users.find((u) => u.userId === subscription.userId);
        const subService = subServices.find(
          (ss) => ss.subServiceId === subscription.subServiceId
        );
        const service = services.find(
          (s) => subService && s.serviceId === subService.serviceId
        );

        const paymentMethod = paymentMethods.find(
          (pm) => pm.Payment === subscription.paymentMethodId
        );

        const subscriptionType = subscriptionTypes.find(
          (st) => st.subService === subscription.subscriptionTypeId
        );

        if (user && service && subService) {
          if (service.serviceId === this.electricityServiceId) {
            const startDate =
              typeof subscription.startDate === 'string'
                ? Number(subscription.startDate)
                : subscription.startDate;
            const endDate =
              typeof subscription.endDate === 'string'
                ? Number(subscription.endDate)
                : subscription.endDate;

            return {
              userId: user.userId,
              userName: user.name,
              serviceName: service.serviceName,
              subscriptionType:
                subscriptionType?.name ||
                subscriptionType?.subscriptionTypeName ||
                'N/A',
              subServiceCode: subService.subServiceCode,
              paymentMethod:
                paymentMethod?.name ||
                paymentMethod?.paymentMethodName ||
                'N/A',
              startDate: this.dateFormatService.unixToDateString(startDate),
              endDate: this.dateFormatService.unixToDateString(endDate),
              discount: subscription.discount || 0,
              status: subscription.isActive ? 'Active' : 'Inactive',
              serviceId: service.serviceId,
              rawData: {
                user,
                service,
                subscription,
                subService,
                paymentMethod,
                subscriptionType,
              },
            };
          }
        }
        return null;
      })
      .filter((item) => item !== null) as CombinedServiceData[];
  }

  private getFormattedDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toISOString();
  }

  onEdit(item: CombinedServiceData): void {
    console.log('Edit item:', item);
    // Add edit logic here
  }

  onDelete(item: CombinedServiceData): void {
    console.log('Delete item:', item);
    this.subscriptionClient
      .deleteById(item.rawData.subscription.subscriptionId)
      .subscribe({
        next: () => this.loadCombinedData(),
        error: (err) => console.error('Delete failed:', err),
      });
  }

  onRefresh(): void {
    this.loadCombinedData();
  }

  onPageChange(event: PageEvent): void {
    console.log('Page changed:', event);
  }

  onSortChange(sort: Sort): void {
    console.log('Sort changed:', sort);
  }
}
