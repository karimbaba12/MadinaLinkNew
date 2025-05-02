import { Component } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import {
  TenantDto,
  UserDto,
  AddressDto,
  TenantClient,
  TenantWithAdminDto,
} from '../../../../Services/api/api-client.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-tenant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './add-tenant.component.html',
  styleUrls: ['./add-tenant.component.scss'],
})
export class AddTenantComponent {
  isSubmitting = false;
  hidePassword = true;
  tenantForm: FormGroup;

  constructor(
    private _formBuilder: FormBuilder,
    private tenantClient: TenantClient,
    private snackBar: MatSnackBar
  ) {
    this.tenantForm = this._formBuilder.group({
      // Tenant Information
      tenantName: ['', Validators.required],
      address: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      email: ['', [Validators.required, Validators.email]],

      // Admin Information
      adminName: ['', [Validators.required, Validators.minLength(2)]],
      adminUsername: ['', [Validators.required, Validators.minLength(3)]],
      adminEmail: ['', [Validators.required, Validators.email]],
      adminPhoneNumber: ['', Validators.pattern(/^\d+$/)],
      adminPasswordHash: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
          ),
        ],
      ],

      // Admin Address (Optional)
      adminCountry: [''],
      adminStreet: [''],
      adminCity: [''],
      adminRegion: [''],
      adminGovernorates: [''],
      adminBuilding: [''],
      adminFloor: [null],
      adminDirection: [''],
      adminBlock: [''],
    });
  }

  submit(): void {
    if (this.tenantForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const tenantWithAdmin = this.prepareTenantWithAdminDto();

      this.tenantClient.addTenantWithAdmin(tenantWithAdmin).subscribe({
        next: () => {
          this.showSuccess('Tenant created successfully!');
          // this.resetForm();
        },
        error: (error) => {
          console.error('Error creating tenant:', error);
          this.showError(
            'Failed to create tenant: ' + (error.message || 'Unknown error')
          );
          this.isSubmitting = false;
        },
      });
    }
  }

  private prepareTenantWithAdminDto(): TenantWithAdminDto {
    const formValue = this.tenantForm.value;
    const tenantWithAdmin = new TenantWithAdminDto();
    tenantWithAdmin.tenantId = 0;
    tenantWithAdmin.tenantName = formValue.tenantName;
    tenantWithAdmin.address = formValue.address;
    tenantWithAdmin.phoneNumber = Number(formValue.phoneNumber);
    tenantWithAdmin.email = formValue.email;
    tenantWithAdmin.createdAt = 0;
    tenantWithAdmin.isActive = true;

    // Set admin user properties
    tenantWithAdmin.user = new UserDto();
    tenantWithAdmin.user.userId = 0;
    tenantWithAdmin.user.name = formValue.adminName;
    tenantWithAdmin.user.username = formValue.adminUsername;
    tenantWithAdmin.user.email = formValue.adminEmail;
    tenantWithAdmin.user.phoneNumber = formValue.adminPhoneNumber
      ? Number(formValue.adminPhoneNumber)
      : 0;
    tenantWithAdmin.user.tenantId = 0;
    tenantWithAdmin.user.passwordHash = formValue.adminPasswordHash;
    tenantWithAdmin.user.roleId = 2;
    tenantWithAdmin.user.createdAt = 0;
    tenantWithAdmin.user.isActive = true;

    tenantWithAdmin.user.address = new AddressDto();
    tenantWithAdmin.user.address.addressId = 0;
    tenantWithAdmin.user.address.country = formValue.adminCountry;
    tenantWithAdmin.user.address.street = formValue.adminStreet;
    tenantWithAdmin.user.address.city = formValue.adminCity;
    tenantWithAdmin.user.address.region = formValue.adminRegion;
    tenantWithAdmin.user.address.governorates = formValue.adminGovernorates;
    tenantWithAdmin.user.address.building = formValue.adminBuilding;
    tenantWithAdmin.user.address.floor = formValue.adminFloor
      ? Number(formValue.adminFloor)
      : 0;
    tenantWithAdmin.user.address.direction = formValue.adminDirection;
    tenantWithAdmin.user.address.block = formValue.adminBlock;

    return tenantWithAdmin;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  resetForm(): void {
    this.tenantForm.reset();
    this.isSubmitting = false;
    // Reset form controls to remove any validation errors
    Object.keys(this.tenantForm.controls).forEach((key) => {
      this.tenantForm.get(key)?.setErrors(null);
    });
  }
}
