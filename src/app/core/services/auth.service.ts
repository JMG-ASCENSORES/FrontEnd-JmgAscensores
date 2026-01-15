import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, User } from '../models/auth.models';

import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  private router = inject(Router);

  // Use environment variable
  private apiUrl = environment.apiUrl;

  // State
  private currentUserSig = signal<User | null>(this.storageService.getUser());
  
  // Computed
  public currentUser = computed(() => this.currentUserSig());
  public isAuthenticated = computed(() => !!this.currentUserSig());
  public isAdmin = computed(() => {
    const user = this.currentUserSig();
    return user?.rol === 'ADMIN';
  });

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      map(response => {
        if (response.success && response.data) {
           this.storageService.saveToken(response.data.accessToken);
           this.storageService.saveRefreshToken(response.data.refreshToken);
           this.storageService.saveUser(response.data.user);
           this.currentUserSig.set(response.data.user);
           return response.data.user;
        } else {
           throw new Error(response.message || 'Login failed');
        }
      })
    );
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.storageService.getRefreshToken();
    return this.http.post<any>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      map(response => {
        if (response.success && response.data && response.data.accessToken) {
          this.storageService.saveToken(response.data.accessToken);
          return response.data.accessToken;
        } else {
          throw new Error('No se pudo renovar el token');
        }
      })
    );
  }

  logout(): void {
    const refreshToken = this.storageService.getRefreshToken();
    
    if (refreshToken) {
      // Call backend to invalidate the refresh token
      this.http.post(`${this.apiUrl}/auth/logout`, { refreshToken })
        .subscribe({
          next: () => {
            console.log('Sesión cerrada en el servidor');
            this.clearSessionAndRedirect();
          },
          error: (err) => {
            console.error('Error al cerrar sesión en el servidor:', err);
            this.clearSessionAndRedirect();
          }
        });
    } else {
      // No refresh token, just clear and redirect
      this.clearSessionAndRedirect();
    }
  }

  // Helper public method for the interceptor to trigger logout
  public forceLogout(): void {
    this.clearSessionAndRedirect();
  }

  private clearSessionAndRedirect(): void {
    this.storageService.clear();
    this.currentUserSig.set(null);
    this.router.navigate(['/auth/login']);
  }
}

