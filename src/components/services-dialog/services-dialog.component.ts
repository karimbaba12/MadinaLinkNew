import { Component, Inject, Input, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogTitle,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  ServiceClient,
  TenantServiceClient,
  TenantServiceDto,
  UserDto,
} from '../../../Services/api/api-client.service';
import { ElectricityComponent } from '../Services/electricity/electricity.component';
import { WaterComponent } from '../Services/water/water.component';
import { InternetComponent } from '../Services/internet/internet.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-services-dialog',
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    ElectricityComponent,
    WaterComponent,
    InternetComponent,
    CommonModule,
    MatButtonModule,
    MatProgressSpinner,
    MatDialogModule,
  ],
  templateUrl: './services-dialog.component.html',
  styleUrls: ['./services-dialog.component.scss'],
})
export class ServicesDialogComponent implements OnInit {
  services: TenantServiceDto[] = [];
  loading = false;
  activeServiceId: number | null = null;
  private serviceNameCache: { [key: number]: string } = {};
  @Input() tenantId!: number;
  @Input() selectedUser!: UserDto;

  constructor(
    private tenantService: TenantServiceClient,
    private serviceClient: ServiceClient,
    public dialogRef: MatDialogRef<ServicesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tenantId: number; user: UserDto }
  ) {
    this.tenantId = data.tenantId;
    this.selectedUser = data.user;
  }

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loading = true;
    this.tenantService.getServiceByTenantID().subscribe({
      next: (services: TenantServiceDto[]) => {
        this.services = services;
        // Set first available service as active by default
        if (this.services.length > 0) {
          this.activeServiceId = this.services[0].serviceId ?? null;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load services:', err);
        this.loading = false;
      },
    });
  }

  setActiveService(serviceId: number): void {
    this.activeServiceId = serviceId;
  }

  getServiceName(serviceId: number): string {
    if (this.serviceNameCache[serviceId]) {
      return this.serviceNameCache[serviceId];
    }

    this.serviceClient.getById(serviceId).subscribe({
      next: (service) => {
        const serviceName = service?.data?.serviceName || 'Unknown';
        this.serviceNameCache[serviceId] = serviceName;
      },
      error: (err) => {
        console.error('Failed to fetch service name:', err);
        this.serviceNameCache[serviceId] = 'Unknown';
      },
    });

    return 'Loading...';
  }

  getServiceComponent(serviceId: number): string {
    switch (serviceId) {
      case 1:
        return 'Electricity';
      case 2:
        return 'Water';
      case 3:
        return 'Internet';
      default:
        return 'Unknown';
    }
  }
}
