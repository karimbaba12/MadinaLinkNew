import { Component, Inject, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../../../Services/Auth/auth.service';
import { RoleService } from '../../../Services/RoleService/role.service';
import { AddressDto, UserDto } from '../../../Services/api/api-client.service';

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.scss'],
  imports: [FormsModule, ReactiveFormsModule],
})
export class UpdateComponent implements OnInit {
  userForm!: FormGroup;
  hidePassword = true;
  availableRoles: any[] = [];
  currentUserRoleId: number | null = null;
  isEditingOwnProfile = false;

  constructor(
    public dialogRef: MatDialogRef<UpdateComponent>,
    private fb: FormBuilder,
    private authService: AuthService,
    private roleService: RoleService,
    @Inject(MAT_DIALOG_DATA) public data: { user: UserDto }
  ) {}

  async ngOnInit() {
    this.currentUserRoleId = this.authService.getUserRoleId();
    this.isEditingOwnProfile =
      this.data.user.userId === this.authService.getUserId();
    await this.roleService.loadRoles();
    this.availableRoles = this.roleService.getAvailableRoles(
      this.currentUserRoleId || 0
    );

    this.initializeForm();
  }

  initializeForm() {
    const user = this.data.user;
    this.userForm = this.fb.group({
      userId: [user.userId || 0],
      name: [user.name || '', [Validators.required, Validators.minLength(2)]],
      username: [
        user.username || '',
        [Validators.required, Validators.minLength(3)],
      ],
      email: [user.email || '', [Validators.required, Validators.email]],
      phoneNumber: [
        user.phoneNumber?.toString() || '',
        [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)],
      ],
      passwordHash: [
        '',
        [
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
          ),
        ],
      ],
      roleId: [
        { value: user.roleId || 0, disabled: !this.canEditRole() },
        [Validators.required],
      ],
      tenantId: [user.tenantId || 0],
      isActive: [
        { value: user.isActive || true, disabled: !this.canEditStatus() },
      ],
      // Address fields
      addressId: [user.address?.addressId || 0],
      country: [user.address?.country || ''],
      street: [user.address?.street || ''],
      city: [user.address?.city || ''],
      region: [user.address?.region || ''],
      governorates: [user.address?.governorates || ''],
      building: [user.address?.building || ''],
      floor: [user.address?.floor || 0],
      direction: [user.address?.direction || ''],
      block: [user.address?.block || ''],
    });
  }

  canEditRole(): boolean {
    if (!this.currentUserRoleId) return false;
    if (this.isEditingOwnProfile) return false;

    const targetUserRole = this.data.user.roleId;

    // Super Admin can edit anyone's role except their own
    if (this.currentUserRoleId === 3) return true;

    // Admin can only edit users and clients
    if (this.currentUserRoleId === 2) {
      return targetUserRole === 1 || targetUserRole === 4; // User or Client
    }

    return false;
  }

  canEditStatus(): boolean {
    if (!this.currentUserRoleId) return false;
    if (this.isEditingOwnProfile) return false;

    const targetUserRole = this.data.user.roleId;

    // Super Admin can edit anyone's status except their own
    if (this.currentUserRoleId === 3) return true;

    // Admin can only edit users and clients status
    if (this.currentUserRoleId === 2) {
      return targetUserRole === 1 || targetUserRole === 4; // User or Client
    }

    return false;
  }

  submit() {
    if (this.userForm.valid) {
      const formValue = this.userForm.getRawValue(); // Get disabled values too
      const userData = {
        userId: formValue.userId,
        name: formValue.name,
        username: formValue.username,
        email: formValue.email,
        phoneNumber: Number(formValue.phoneNumber),
        passwordHash: formValue.passwordHash || undefined, // Only send if changed
        roleId: formValue.roleId,
        tenantId: formValue.tenantId,
        isActive: formValue.isActive,
        // address: {
        //   addressId: formValue.addressId,
        //   country: formValue.country,
        //   street: formValue.street,
        //   city: formValue.city,
        //   region: formValue.region,
        //   governorates: formValue.governorates,
        //   building: formValue.building,
        //   floor: formValue.floor,
        //   direction: formValue.direction,
        //   block: formValue.block,
        // },
      };
      this.dialogRef.close(userData);
    }
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
