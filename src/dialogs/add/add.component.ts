import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../../Services/Auth/auth.service';
import { RoleService } from '../../../Services/RoleService/role.service';
import { AddressDto, UserDto } from '../../../Services/api/api-client.service';

@Component({
  selector: 'app-add',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss'],
})
export class AddComponent implements OnInit {
  userForm: FormGroup;
  hidePassword = true;
  availableRoles: any[] = [];
  currentUserRoleId: number | null = null;
  currentUserTenantId: number | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<AddComponent>,
    private fb: FormBuilder,
    private authService: AuthService,
    private roleService: RoleService
  ) {
    // Initialize form with empty structure
    this.userForm = this.fb.group({
      userId: [0],
      name: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^\d+$/)]],
      tenantId: [],
      createdAt: [0],
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
      roleId: [0, Validators.required],
      addressId: [0],
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

  async ngOnInit() {
    try {
      this.isLoading = true;
      this.currentUserRoleId = this.authService.getUserRoleId();
      this.currentUserTenantId = this.authService.getUserTenantId();
      // Load roles and update form
      await this.roleService.loadRoles();
      this.availableRoles = this.roleService.getAvailableRoles(
        this.currentUserRoleId || 0
      );

      // Update roleId control after roles are loaded
      this.userForm
        .get('roleId')
        ?.setValue(this.availableRoles[0]?.roleId || 1);
    } catch (error) {
      console.error('Error loading roles:', error);
      this.errorMessage = 'Failed to load roles. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async submit() {
    const payloadSize = JSON.stringify(this.userForm.value).length;
    console.log('rnnnning');
    console.log('Payload size:', payloadSize, 'bytes');

    if (this.userForm.valid) {
      const formValue = this.userForm.value;

      if (!this.validateDataBeforeSubmit(formValue)) {
        this.errorMessage = 'Invalid form data. Please check your inputs.';
        return;
      }
      if (this.userForm.valid) {
        const formValue = this.userForm.value;
        console.log(this.userForm);

        var userData = new UserDto();
        //form formValue like address
        userData.userId = 0;
        userData.name = formValue.name;
        userData.username = formValue.username;
        userData.email = formValue.email;
        userData.phoneNumber = Number(formValue.phoneNumber);
        userData.tenantId = 0;
        userData.passwordHash = formValue.passwordHash;
        userData.roleId = Number(formValue.roleId);
        userData.createdAt = 0;
        userData.isActive = true;
        userData.address = new AddressDto();

        userData.address.addressId = 0;
        userData.address.country = formValue.country;
        userData.address.street = formValue.street;
        userData.address.city = formValue.city;
        userData.address.region = formValue.region;
        userData.address.governorates = formValue.governorates;
        userData.address.building = formValue.building;
        userData.address.floor = Number(formValue.floor);
        userData.address.direction = formValue.direction;
        userData.address.block = formValue.block;

        console.log('Final API payload:', userData);
        this.dialogRef.close(userData);
      }
    }
  }

  private markAllAsTouched() {
    Object.values(this.userForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }
  private validateDataBeforeSubmit(formValue: any): boolean {
    // Check roleId is a valid number
    if (isNaN(Number(formValue.roleId))) {
      console.error('Invalid roleId:', formValue.roleId);
      return false;
    }

    // Check phoneNumber is valid
    if (isNaN(Number(formValue.phoneNumber))) {
      console.error('Invalid phoneNumber:', formValue.phoneNumber);
      return false;
    }

    return true;
  }

  getRoleName(roleId: number): string {
    const roleMap: { [key: number]: string } = {
      1: 'User',
      2: 'Admin',
      3: 'Super Admin',
      4: 'Client',
    };
    return roleMap[roleId] || 'Unknown Role';
  }
}
