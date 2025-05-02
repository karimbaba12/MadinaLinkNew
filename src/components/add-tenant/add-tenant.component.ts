import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { CommonModule } from '@angular/common';
import {
  TenantDto,
  UserDto,
  AddressDto,
  TenantClient,
  UsersClient,
} from '../../../Services/api/api-client.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-tenant',
  imports: [
    CommonModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './add-tenant.component.html',
  styleUrl: './add-tenant.component.scss',
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
  ],
})
export class AddTenantComponent {
  isSubmitting = false;
  hidePassword = true;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  tenantForm: FormGroup;
  adminForm: FormGroup;

  constructor(
    private _formBuilder: FormBuilder,
    private tenantClient: TenantClient,
    private snackBar: MatSnackBar,
    private userClient: UsersClient
  ) {
    this.tenantForm = this._formBuilder.group({
      tenantName: ['', Validators.required],
      address: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      email: ['', [Validators.required, Validators.email]],
    });
    this.adminForm = this._formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^\d+$/)]],
      passwordHash: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
          ),
        ],
      ],
      country: [''],
      street: [''],
      city: [''],
      region: [''],
      governorates: [''],
      building: [''],
      floor: [0],
      direction: [''],
      block: [''],
    });
  }

  // Admin creation form

  submit() {
    if (this.tenantForm.valid && this.adminForm.valid) {
      this.isSubmitting = true;
      this.createTenant(this.tenantForm.value)
        .then(() => {
          this.successMessage = 'Tenant created successfully!';
          this.snackBar.open(this.successMessage, 'Close', {
            duration: 3000,
          });
          this.createAdmin();
        })
        .catch((error) => {
          this.errorMessage = 'Failed to create tenant.';
          this.snackBar.open(this.errorMessage, 'Close', {
            duration: 3000,
          });
        })
        .finally(() => {
          this.isSubmitting = false;
        });
    }
  }

  createTenant(tenant: TenantDto) {
    const tenantData = new TenantDto();
    tenantData.tenantId = 0;
    tenantData.tenantName = this.tenantForm.value.tenantName!;
    tenantData.address = this.tenantForm.value.address!;
    tenantData.phoneNumber = Number(this.tenantForm.value.phoneNumber);
    tenantData.email = this.tenantForm.value.email!;
    tenantData.createdAt = Date.now();
    tenantData.isActive = true;
    return this.tenantClient.add(tenantData).toPromise();
  }
  createAdmin() {
    const adminData = new UserDto();

    adminData.userId = 0;
    adminData.name = this.adminForm.value.name!;
    adminData.username = this.adminForm.value.username!;
    adminData.email = this.adminForm.value.email!;
    adminData.phoneNumber = Number(this.adminForm.value.phoneNumber) || 0;
    adminData.tenantId = 0;
    adminData.passwordHash = this.adminForm.value.passwordHash!;
    adminData.roleId = 2;
    adminData.createdAt = Date.now();
    adminData.isActive = true;
    adminData.address = new AddressDto();
    {
      adminData.address.addressId = 0;
      adminData.address.country = this.adminForm.value.country!;
      adminData.address.street = this.adminForm.value.street!;
      adminData.address.city = this.adminForm.value.city!;
      adminData.address.region = this.adminForm.value.region!;
      adminData.address.governorates = this.adminForm.value.governorates!;
      adminData.address.building = this.adminForm.value.building!;
      adminData.address.floor = Number(this.adminForm.value.floor) || 0; // Default to 0 if not provided
      adminData.address.direction = this.adminForm.value.direction!;
      adminData.address.block = this.adminForm.value.block!;
    }

    return this.userClient.add(adminData).toPromise();
  }
  resetForm() {
    this.tenantForm.reset();
    this.adminForm.reset();
    this.isSubmitting = false;
    this.errorMessage = '';
    this.successMessage = '';
  }
}
