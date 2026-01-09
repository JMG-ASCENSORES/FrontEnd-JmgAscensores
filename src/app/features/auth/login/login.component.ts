import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    dni: ['', [Validators.required, Validators.minLength(8)]],
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required]]
  });

  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const formValue = this.loginForm.value;
      
      // Determine role based on email for SIMULATION purpose
      let mockRole: 'admin' | 'trabajador' = 'trabajador';
      if (formValue.correo?.includes('admin')) {
        mockRole = 'admin';
      }

      // Payload matching interface
      const payload: any = { 
        correo: formValue.correo, 
        contrasena: formValue.contrasena, 
        rol: mockRole // In real app, backend determines role or verifies it
      }; 

      // Simulate network delay for effect
      setTimeout(() => {
        this.authService.login(payload).subscribe({
          next: (response) => {
            // Override local role with response role if backend sends it
            // For now assuming the auth service handles the state update
            if (response.rol === 'admin') {
              this.router.navigate(['/admin/dashboard']);
            } else {
              this.router.navigate(['/worker/home']);
            }
          },
          error: (err) => {
             // Fallback for simulation if backend is offline
             console.warn('Backend unavailable, using mock login for demo');
             this.handleMockLogin(mockRole, formValue);
          }
        });
      }, 1000);
    }
  }

  // Helper for dev without backend
  private handleMockLogin(role: 'admin' | 'trabajador', formValue: any) {
     const mockUser = {
       token: 'mock-jwt-token-123',
       usuario: {
         admin_id: 1, // or trabajador_id
         dni: formValue.dni || '00000000',
         nombre: 'Usuario',
         apellido: 'Prueba',
         correo: formValue.correo || 'test@test.com',
         activo: true,
         fecha_creacion: new Date().toISOString()
       },
       rol: role
     };

     // Manually saving to storage since we bypassed the service typical flow
     localStorage.setItem('auth_token', mockUser.token);
     localStorage.setItem('auth_user', JSON.stringify(mockUser.usuario));

     this.isLoading = false;
     if (role === 'admin') {
       this.router.navigate(['/admin/dashboard']);
     } else {
       this.router.navigate(['/worker/home']);
     }
  }
}

