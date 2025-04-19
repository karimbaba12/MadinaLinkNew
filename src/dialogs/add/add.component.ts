import { Component } from '@angular/core';
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

@Component({
  selector: 'app-add',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './add.component.html',
  styleUrl: './add.component.scss',
})
export class AddComponent {
  userForm!: FormGroup;
  hidePassword = true;
  availableRoles: any[] = [];
  currentUserRoleId: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<AddComponent>,
    private fb: FormBuilder,
    private authService: AuthService,
    private roleService: RoleService
  ) {}
  async ngOnInit() {
    this.currentUserRoleId = this.authService.getUserRoleId();
    await this.roleService.loadRoles();
    this.availableRoles = this.roleService.getAvailableRoles(
      this.currentUserRoleId || 0
    );

    this.initializeForm();
  }
  initializeForm() {
    this.userForm = this.fb.group({
      userId: [0],
      name: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)],
      ],
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
      roleId: [this.availableRoles[0]?.roleId || 1, Validators.required],
      // Address fields
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

  submit() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const userData = {
        ...formValue,
        phoneNumber: Number(formValue.phoneNumber),
        isActive: true,
        address: {
          addressId: formValue.addressId,
          country: formValue.country,
          street: formValue.street,
          city: formValue.city,
          region: formValue.region,
          governorates: formValue.governorates,
          building: formValue.building,
          floor: formValue.floor,
          direction: formValue.direction,
          block: formValue.block,
        },
      };

      this.dialogRef.close(userData);
    }
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
