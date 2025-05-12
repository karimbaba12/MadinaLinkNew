import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {
  ServiceClient,
  SubscriptionTypeClient,
  SubServiceClient,
  SubServiceDto,
} from '../../../../Services/api/api-client.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ReactiveFormsModule } from '@angular/forms';
import { CrudTableConfig } from '../../../data/menu/reusableCrudData';
import { ReusableCrudComponent } from '../../reusable-crud/reusable-crud.component';
import { MatIcon } from '@angular/material/icon';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
} from '@angular/material/form-field';
import { MatOption } from '@angular/material/select';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddSubServiceComponent } from '../add-sub-service/add-sub-service.component';
import { MatDialog } from '@angular/material/dialog';
import { DeleteComponent } from '../../../dialogs/delete/delete.component';
import { forkJoin } from 'rxjs';
interface DisplaySubServiceDto extends SubServiceDto {
  serviceName: string;
  subscriptionTypeName: string;
}

@Component({
  standalone: true,
  selector: 'app-subservice-management',
  imports: [
    CommonModule,
    ReusableCrudComponent,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    ButtonModule,
    TableModule,

    ReactiveFormsModule,
    MatIcon,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatOption,
    MatError,
    MatProgressSpinner,
    MatCardActions,
    MatHint,
  ],
  templateUrl: './subservice-management.component.html',
  styleUrls: ['./subservice-management.component.scss'],
  providers: [ConfirmationService, MessageService],
})
export class SubserviceManagementComponent implements OnInit {
  subServiceForm: FormGroup;
  services: any[] = [];
  subscriptionTypes: any[] = [];
  subServices: SubServiceDto[] = [];
  isLoading = false;
  displayDialog = false;
  isEditMode = false;
  currentSubServiceId: number | null = null;
  showDeleteConfirm = false;
  deleteItemId: number | null = null;
  deleteItemName = '';

  config: CrudTableConfig<DisplaySubServiceDto> = {
    title: 'Sub Services Management',
    columns: [
      {
        name: 'serviceName',
        header: 'Service',
        sortable: true,
      },
      {
        name: 'subscriptionTypeName',
        header: 'Subscription Type',
        sortable: true,
      },

      { name: 'subServiceCode', header: 'Code', sortable: true },
      { name: 'subServiceName', header: 'Name', sortable: true },
      {
        name: 'price',
        header: 'Price ($)',
        sortable: true,
      },
    ],
    dataSource: [],
  };

  constructor(
    private fb: FormBuilder,
    private serviceClient: ServiceClient,
    private subscriptionTypeClient: SubscriptionTypeClient,
    private subServiceClient: SubServiceClient,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.subServiceForm = this.fb.group({
      serviceId: [null, Validators.required],
      subscriptionTypeId: [null, Validators.required],
      subServiceCode: ['', [Validators.required, Validators.maxLength(20)]],
      subServiceName: ['', [Validators.required, Validators.maxLength(100)]],

      price: [null, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadServices(): void {
    this.isLoading = true;
    this.serviceClient.getAll().subscribe({
      next: (data) => {
        this.services = data.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.showError('Failed to load services');
        this.isLoading = false;
      },
    });
  }
  loadInitialData(): void {
    this.isLoading = true;

    // Load services and subscription types in parallel
    forkJoin([
      this.serviceClient.getAll(),
      this.subscriptionTypeClient.getAll(),
    ]).subscribe({
      next: ([servicesResponse, subscriptionTypesResponse]) => {
        this.services = servicesResponse.data || [];
        this.subscriptionTypes = subscriptionTypesResponse.data || [];

        // Now load sub-services after we have the lookup data
        this.loadSubServices();
      },
      error: (error) => {
        this.showError('Failed to load initial data');
        this.isLoading = false;
      },
    });
  }
  loadSubscriptionTypes(): void {
    this.isLoading = true;
    this.subscriptionTypeClient.getAll().subscribe({
      next: (data) => {
        this.subscriptionTypes = data.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.showError('Failed to load subscription types');
        this.isLoading = false;
      },
    });
  }

  loadSubServices(): void {
    this.subServiceClient.getAll().subscribe({
      next: (data) => {
        this.subServices = data.data || [];
        this.config.dataSource = this.subServices.map((item) => ({
          ...item,
          serviceName: this.getServiceName(item.serviceId ?? 0),
          subscriptionTypeName: this.getSubscriptionTypeName(
            item.subscriptionTypeId ?? 0
          ),
          init: item.init ? item.init.bind(item) : () => {},
          toJSON: item.toJSON ? item.toJSON.bind(item) : () => ({}),
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.showError('Failed to load sub-services');
        this.isLoading = false;
      },
    });
  }

  getServiceName(serviceId: number): string {
    if (!serviceId) return '-';
    const service = this.services.find((s) => s.serviceId === serviceId);
    return service?.serviceName;
  }

  getSubscriptionTypeName(subscriptionTypeId: number): string {
    if (!subscriptionTypeId) return '-';
    const type = this.subscriptionTypes.find(
      (t) => t.subscriptionTypeId === subscriptionTypeId
    );
    return type?.subscriptionTypeName;
  }

  onSubmit(): void {
    if (this.subServiceForm.invalid) {
      this.markFormGroupTouched(this.subServiceForm);
      return;
    }

    this.isLoading = true;
    const formData: SubServiceDto = {
      ...this.subServiceForm.value,
      subServiceId: this.currentSubServiceId || 0,
      tenantId: 0,
    };

    const operation = this.isEditMode
      ? this.subServiceClient.update(formData)
      : this.subServiceClient.add(formData);

    operation.subscribe({
      next: () => {
        this.showSuccess(
          `Sub-service ${this.isEditMode ? 'updated' : 'added'} successfully`
        );
        this.loadSubServices();
        this.displayDialog = false;
      },
      error: (error) => {
        this.showError(
          `Failed to ${this.isEditMode ? 'update' : 'add'} sub-service`
        );
        this.isLoading = false;
      },
    });
  }
  confirmDelete(subService: SubServiceDto): void {
    const dialogRef = this.dialog.open(DeleteComponent, {
      width: '450px',
      disableClose: true,
      data: {
        title: 'Delete Sub-Service',
        message: `Are you sure you want to delete "${subService.subServiceName}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed && subService.subServiceId) {
        this.deleteSubService(subService.subServiceId);
      }
    });
  }

  deleteSubService(subServiceId: number): void {
    this.isLoading = true;
    this.subServiceClient.deleteById(subServiceId).subscribe({
      next: () => {
        this.showSuccess('Sub-service deleted successfully');
        this.loadSubServices();
      },
      error: (error) => {
        this.showError('Failed to delete sub-service');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  closeDialog(): void {
    this.displayDialog = false;
    this.subServiceForm.reset();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
    this.isLoading = false;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar'],
    });
    this.isLoading = false;
  }

  openAddEditDialog(editMode = false, subService?: SubServiceDto): void {
    const dialogRef = this.dialog.open(AddSubServiceComponent, {
      width: '800px',
      disableClose: true,
      data: {
        isEdit: editMode,
        subServiceData: subService,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.saveSubService(result, editMode);
      }
    });
  }

  // Add this new method to handle saving:
  saveSubService(subServiceData: SubServiceDto, isEditMode: boolean): void {
    this.isLoading = true;

    const operation = isEditMode
      ? this.subServiceClient.update(subServiceData)
      : this.subServiceClient.add(subServiceData);

    operation.subscribe({
      next: () => {
        this.showSuccess(
          `Sub-service ${isEditMode ? 'updated' : 'added'} successfully`
        );
        this.loadSubServices();
      },
      error: (error) => {
        this.showError(
          `Failed to ${isEditMode ? 'update' : 'add'} sub-service`
        );
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
