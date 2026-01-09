import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, Admin, Worker } from '../models/auth.models';

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
  private currentUserSig = signal<Admin | Worker | null>(this.storageService.getUser());
  
  // Computed
  public currentUser = computed(() => this.currentUserSig());
  public isAuthenticated = computed(() => !!this.currentUserSig());
  public isAdmin = computed(() => {
    const user = this.currentUserSig();
    // Simple check based on properties or stored role. 
    // Ideally we store the role in a separate signal or inspect the structure.
    return user && 'admin_id' in user;
  });

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/login`, credentials).pipe(
      tap(response => {
        this.storageService.saveToken(response.token);
        this.storageService.saveUser(response.usuario);
        this.currentUserSig.set(response.usuario);
      })
    );
  }

  logout(): void {
    this.storageService.clear();
    this.currentUserSig.set(null);
    this.router.navigate(['/auth/login']);
  }
}
