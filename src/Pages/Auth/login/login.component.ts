import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  RoleClient,
  LoginRequestDTO,
} from '../../../../Services/api/api-client.service';
import { AuthService } from '../../../../Services/Auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  providers: [],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  hide: boolean = true;
  loading: boolean = false;
  rememberMe: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private roleClient: RoleClient
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false],
    });
  }

  async login(): Promise<void> {
    this.loading = true;
    this.errorMessage = null;

    const loginRequestData = new LoginRequestDTO();
    loginRequestData.username = this.loginForm.value.username;
    loginRequestData.password = this.loginForm.value.password;

    this.authService
      .login(loginRequestData)
      .pipe(
        catchError((error) => {
          console.error('AuthService: Login error', error);
          this.errorMessage = 'Login failed. Please check your credentials.';
          this.loading = false;
          return throwError(error);
        })
      )
      .subscribe({
        next: async (response) => {
          if (response?.data) {
            const token = response.data;
            this.authService.setAuthToken(token);

            const roleName = await this.authService.getUserRole();
            console.log('User Role:', roleName);

            if (roleName) {
              switch (roleName) {
                case 'admin':
                case 'superadmin':
                case 'user':
                  this.router.navigate(['/admin/dashboard']);
                  break;
                default:
                  this.router.navigate(['/admin/dashboard']);
              }
            } else {
              console.error('Role not found or invalid');
              this.router.navigate(['/unauthorized']);
            }
          } else {
            this.errorMessage = 'No token received';
          }
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
}
