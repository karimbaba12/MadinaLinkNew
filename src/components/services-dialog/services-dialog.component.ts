import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
} from '@angular/material/dialog';
import {
  TenantServiceClient,
  TenantServiceDto,
} from '../../../Services/api/api-client.service';
import { AuthService } from '../../../Services/Auth/auth.service';
import { ElectricityComponent } from '../Services/electricity/electricity.component';
import { WaterComponent } from '../Services/water/water.component';
import { InternetComponent } from '../Services/internet/internet.component';
import { CommonModule } from '@angular/common';
import { SERVICE_IDS } from '../../data/ServiceType';
@Component({
  selector: 'app-services-dialog',
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogContent,
    ElectricityComponent,
    WaterComponent,
    InternetComponent,
    CommonModule,
  ],
  templateUrl: './services-dialog.component.html',
  styleUrl: './services-dialog.component.scss',
})
export class ServicesDialogComponent implements OnInit {
  services: TenantServiceDto[] = [];
  loading = false;
  selectedServiceId: number | null = null;
  tenantId: number | null = null;
  constructor(
    public dialogRef: MatDialogRef<ServicesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tenantId: number },
    private tenantService: TenantServiceClient
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loading = true;
    this.tenantService.getServiceByTenantID().subscribe({
      next: (services: any) => {
        console.log('the services are ', services);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load services:', err);
        this.loading = false;
      },
    });
  }
}
