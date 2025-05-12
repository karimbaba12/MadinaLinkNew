import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SubServiceDto } from '../../../../Services/api/api-client.service';
import {
  SubscriptionTypeClient,
  ServiceClient,
} from '../../../../Services/api/api-client.service';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-add-sub-service',
  templateUrl: './add-sub-service.component.html',
  styleUrls: ['./add-sub-service.component.scss'],
})
export class AddSubServiceComponent implements OnInit {
  subServiceForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  services: any[] = [];
  subscriptionTypes: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<AddSubServiceComponent>,
    private fb: FormBuilder,
    private serviceClient: ServiceClient,
    private subscriptionTypeClient: SubscriptionTypeClient,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.subServiceForm = this.fb.group({
      serviceId: [null, Validators.required],
      subscriptionTypeId: [null, Validators.required],
      subServiceCode: [
        '',
        [
          Validators.required,
          Validators.maxLength(20),
          Validators.pattern(/^[a-zA-Z0-9\-_]+$/),
        ],
      ],
      subServiceName: ['', [Validators.required, Validators.maxLength(100)]],
    
      price: [
        null,
        [Validators.required, Validators.min(0), Validators.max(1000000)],
      ],
    });
  }

  ngOnInit(): void {
    this.loadServices();
    this.loadSubscriptionTypes();

    if (this.data?.isEdit && this.data?.subServiceData) {
      const subService = this.data.subServiceData;
      this.subServiceForm.patchValue({
        serviceId: subService.serviceId,
        subscriptionTypeId: subService.subscriptionTypeId,
        subServiceCode: subService.subServiceCode,
        subServiceName: subService.subServiceName,
        price: subService.price,
      });
    }
  }

  // Update the submit method to include subServiceId for edits
  submit(): void {
    if (this.subServiceForm.invalid) {
      this.markFormGroupTouched(this.subServiceForm);
      this.errorMessage = 'Please fill all required fields correctly.';
      return;
    }

    const formValue = this.subServiceForm.value;
    const subserviceData = new SubServiceDto();

    subserviceData.serviceId = formValue.serviceId;
    subserviceData.subscriptionTypeId = formValue.subscriptionTypeId;
    subserviceData.subServiceCode = formValue.subServiceCode;
    subserviceData.subServiceName = formValue.subServiceName;
    subserviceData.price = formValue.price;
    subserviceData.tenantId = 0;
    subserviceData.subServiceId = this.data?.isEdit
      ? this.data.subServiceData.subServiceId
      : 0;

    this.dialogRef.close(subserviceData);
  }

  loadServices(): void {
    this.isLoading = true;
    this.serviceClient
      .getAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.services = response.data || [];
        },
        error: (error) => {
          this.errorMessage = 'Failed to load services. Please try again.';
          console.error('Error loading services:', error);
        },
      });
  }

  loadSubscriptionTypes(): void {
    this.isLoading = true;
    this.subscriptionTypeClient
      .getAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.subscriptionTypes = response.data || [];
        },
        error: (error) => {
          this.errorMessage =
            'Failed to load subscription types. Please try again.';
          console.error('Error loading subscription types:', error);
        },
      });
  }

  getServiceName(serviceId: number): string {
    const service = this.services.find((s) => s.serviceId === serviceId);
    return service?.serviceName || 'Select Service';
  }

  getSubscriptionTypeName(subscriptionTypeId: number): string {
    const type = this.subscriptionTypes.find(
      (t) => t.subscriptionTypeId === subscriptionTypeId
    );
    return type?.subscriptionTypeName || 'Select Type';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
