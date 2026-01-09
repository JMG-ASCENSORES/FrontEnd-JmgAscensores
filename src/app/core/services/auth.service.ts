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
    // Simple check based on properties or stored role. 
    // Ideally we store the role in a separate signal or inspect the structure.
    return user && 'admin_id' in user;
  });

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      map(response => {
        if (response.success && response.data) {
           this.storageService.saveToken(response.data.accessToken);
           this.storageService.saveUser(response.data.user);
           this.currentUserSig.set(response.data.user);
           return response.data.user;
        } else {
           throw new Error(response.message || 'Login failed');
        }
      })
    );
  }

  logout(): void {
    this.storageService.clear();
    this.currentUserSig.set(null);
    this.router.navigate(['/auth/login']);
  }
}
