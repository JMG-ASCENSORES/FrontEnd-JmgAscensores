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
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    contrasena: ['', [Validators.required]]
  });

  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      // Get values before disabling the form
      const formValue = this.loginForm.value;
      this.loginForm.disable();
      
      const payload = { 
        dni: formValue.dni || '', 
        contrasena: formValue.contrasena || ''
      }; 

      this.authService.login(payload)
        .subscribe({
          next: (user) => {
            this.isLoading = false;
            this.loginForm.enable();
            
            if (user.rol === 'ADMIN') {
              this.router.navigate(['/admin/dashboard']);
            } else if (user.rol === 'TECNICO') {
              this.router.navigate(['/worker/home']);
            } else {
               this.router.navigate(['/']); 
            }
          },
          error: (err) => {
             this.isLoading = false;
             this.loginForm.enable();
             console.error('Login error:', err);
             
             if (err.error && err.error.message) {
               this.errorMessage = err.error.message;
             } else {
               this.errorMessage = 'Credenciales inválidas o error de conexión';
             }
          }
        });
    }
  }
}


