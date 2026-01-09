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
    contrasena: ['', [Validators.required]]
  });

  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const formValue = this.loginForm.value;
      
      const payload = { 
        dni: formValue.dni || '', 
        contrasena: formValue.contrasena || ''
      }; 

      this.authService.login(payload).subscribe({
        next: (user) => {
          this.isLoading = false;
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
           this.errorMessage = err.message || 'Credenciales inválidas o error de conexión';
           console.error('Login error:', err);
        }
      });
    }
  }
}

