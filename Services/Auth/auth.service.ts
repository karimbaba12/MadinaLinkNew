import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, map, Observable, of, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import {
  AuthClient,
  LoginRequestDTO,
  UsersClient,
  RoleClient,
  ApiResponse_1OfOfStringAndCoreLibAnd_0AndCulture_neutralAndPublicKeyToken_7cec85d7bea7798e,
} from '../api/api-client.service';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private authClient: AuthClient,
    private UsersClient: UsersClient,
    private RoleClient: RoleClient
  ) {}

  login(
    credentials: LoginRequestDTO
  ): Observable<ApiResponse_1OfOfStringAndCoreLibAnd_0AndCulture_neutralAndPublicKeyToken_7cec85d7bea7798e> {
    //console.log('AuthService: Sending login request', credentials);

    return this.authClient.login(credentials).pipe(
      tap((response) => {
        if (response?.data) {
          this.setAuthToken(response.data);
        }
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('data');
    this.router.navigate(['/login']);
  }

  getDecodedToken(): any {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const base64Payload = token.split('.')[1];
      const decodedPayload = atob(base64Payload);
      return JSON.parse(decodedPayload);
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  }

  getUserId(): number | null {
    const decodedToken = this.getDecodedToken();
    console.log('Decoded Token:', decodedToken);
    return decodedToken ? +decodedToken['sub'] : null;
  }

  async getUserRole(): Promise<string | null> {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken || !decodedToken['Role']) return null;

    const roleId = Number(decodedToken['Role']);
    if (isNaN(roleId)) return null;

    try {
      const roleResponse = await firstValueFrom(
        this.RoleClient.getById(roleId)
      );
      //console.log(roleResponse);
      return roleResponse?.data?.roleName || null;
    } catch (err) {
      console.error('Error fetching role by ID:', err);
      return null;
    }
  }
  getUserRoleId(): number | null {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken || !decodedToken['Role']) return null;
    return Number(decodedToken['Role']);
  }
  getUserTenantId(): number | null {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken || !decodedToken['TenantId']) return null;
    return Number(decodedToken['TenantId']);
  }
  async getUserRoleName(): Promise<string | null> {
    const roleId = this.getUserRoleId();
    if (!roleId) return null;

    try {
      const roleResponse = await firstValueFrom(
        this.RoleClient.getById(roleId)
      );
      return roleResponse?.data?.roleName || null;
    } catch (err) {
      console.error('Error fetching role:', err);
      return null;
    }
  }

  isAdmin(): boolean {
    const roleId = this.getUserRoleId();
    return roleId === 2;
  }

  isSuperAdmin(): boolean {
    const roleId = this.getUserRoleId();
    return roleId === 3;
  }
  isLoggedIn(): boolean {
    return !!this.getDecodedToken();
  }

  getCurrentUserProfile(): Observable<any> {
    const decoded = this.getDecodedToken();
    if (decoded && decoded.sub) {
      const userId = decoded.sub;
      return this.UsersClient.getById(userId).pipe(
        tap((res) => {}),
        catchError((err) => {
          console.error('Error fetching user by ID:', err);
          throw err;
        })
      );
    } else {
      console.warn('Invalid or missing token.');
      return new Observable();
    }
  }
}
