import { Component, Inject, OnInit } from '@angular/core';
import * as _ from 'lodash';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  AbstractControl,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../../../Services/Auth/auth.service';
import { RoleService } from '../../../Services/RoleService/role.service';
import { AddressDto, UserDto } from '../../../Services/api/api-client.service';
import { CommonModule } from '@angular/common';

const PASSWORD_UNCHANGED_FLAG = '[UNCHANGED]';
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  styleUrl: './update.component.scss',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
})
export class UpdateComponent implements OnInit {
  userForm!: FormGroup;
  hidePassword = true;
  availableRoles: any[] = [];
  currentUserRoleId: number | null = null;
  isEditingOwnProfile = false;
  isPasswordChanged = false;
  isSaving = false;
  initialFormValues: any;
  constructor(
    public dialogRef: MatDialogRef<UpdateComponent>,
    private fb: FormBuilder,
    private authService: AuthService,
    private roleService: RoleService,
    @Inject(MAT_DIALOG_DATA) public data: { user: UserDto }
  ) {}

  async ngOnInit() {
    console.log(`the data are`, this.data.user.address);
    this.currentUserRoleId = this.authService.getUserRoleId();
    this.isEditingOwnProfile =
      this.data.user.userId === this.authService.getUserId();
    await this.roleService.loadRoles();
    this.availableRoles = this.roleService.getAvailableRoles(
      this.currentUserRoleId || 0
    );

    this.initializeForm();
  }

  private async initializeRoles() {
    await this.roleService.loadRoles();
    this.availableRoles = this.roleService.getAvailableRoles(
      this.currentUserRoleId || 0
    );
  }

  initializeForm() {
    const { user } = this.data;
    const address = user.address || ({} as AddressDto);

    this.userForm = this.fb.group({
      userId: [user.userId || 0],
      name: [user.name || '', [Validators.required, Validators.minLength(2)]],
      username: [
        user.username || '',
        [Validators.required, Validators.minLength(3)],
      ],
      email: [user.email || '', [Validators.required, Validators.email]],
      phoneNumber: [
        user.phoneNumber || '',
        [Validators.required, Validators.pattern(/^[0-9]{8,12}$/)],
      ],
      passwordHash: [
        PASSWORD_UNCHANGED_FLAG,
        [
          (control: AbstractControl) => {
            if (control.value === PASSWORD_UNCHANGED_FLAG) return null;
            const composedValidator = Validators.compose([
              Validators.minLength(8),
              Validators.pattern(PASSWORD_PATTERN),
            ]);
            return composedValidator ? composedValidator(control) : null;
          },
        ],
      ],
      roleId: [
        { value: user.roleId || '', disabled: !this.canEditRole() },
        [Validators.required],
      ],
      tenantId: [user.tenantId || 0],
      createdAt: [user.createdAt || 0],
      isActive: [
        { value: user.isActive ?? true, disabled: !this.canEditStatus() },
      ],
      address: this.fb.group({
        addressId: [address.addressId || 0],
        country: [address.country || ''],
        street: [address.street || ''],
        city: [address.city || ''],
        region: [address.region || ''],
        governorates: [address.governorates || ''],
        building: [address.building || ''],
        floor: [address.floor || 0],
        direction: [address.direction || ''],
        block: [address.block || ''],
      }),
    });

    this.initialFormValues = this.userForm.getRawValue();

    // Track password changes
    this.userForm.get('passwordHash')?.valueChanges.subscribe((value) => {
      this.isPasswordChanged = value !== PASSWORD_UNCHANGED_FLAG;
    });
  }
  hasFormChanged(): boolean {
    const currentValues = this.userForm.getRawValue();
    return !_.isEqual(currentValues, this.initialFormValues);
  }

  async submit() {
    if (this.userForm?.valid && this.hasFormChanged()) {
      this.isSaving = true;
      try {
        const formValue = this.userForm.getRawValue();
        const userData = this.prepareUserData(formValue);
        this.dialogRef.close(userData);
      } catch (error) {
        console.error('Error during submission:', error);
      } finally {
        this.isSaving = false;
      }
    }
  }
  private prepareUserData(formValue: any): UserDto {
    const userData: UserDto = {
      ...formValue,
      phoneNumber: Number(formValue.phoneNumber),
      address: formValue.address,
    };

    // Only include passwordHash if it was changed
    if (formValue.passwordHash !== PASSWORD_UNCHANGED_FLAG) {
      userData.passwordHash = formValue.passwordHash;
    } else {
      delete userData.passwordHash; // Or set to undefined
    }

    return userData;
  }

  canEditRole(): boolean {
    if (!this.currentUserRoleId) return false;
    if (this.isEditingOwnProfile) return false;
    const targetUserRole = this.data.user.roleId;
    if (this.currentUserRoleId === 3) return true;
    if (this.currentUserRoleId === 2)
      return targetUserRole === 1 || targetUserRole === 4;
    return false;
  }

  canEditStatus(): boolean {
    if (!this.currentUserRoleId) return false;
    if (this.isEditingOwnProfile) return false;
    const targetUserRole = this.data.user.roleId;
    if (this.currentUserRoleId === 3) return true;
    if (this.currentUserRoleId === 2)
      return targetUserRole === 1 || targetUserRole === 4;
    if (this.currentUserRoleId === 1) return targetUserRole === 4;
    return false;
  }

  getRoleName(roleId: number): string {
    const roles: { [key: number]: string } = {
      1: 'User',
      2: 'Admin',
      3: 'Super Admin',
      4: 'Client',
    };
    return roles[roleId] || 'Unknown';
  }
}
