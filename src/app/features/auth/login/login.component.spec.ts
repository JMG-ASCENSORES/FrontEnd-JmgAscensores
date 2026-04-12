import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.models';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let routerMock: any;

  const mockAdminUser: User = {
    id: 1,
    dni: '12345678',
    nombre: 'Juan',
    apellido: 'Pérez',
    correo: 'juan@example.com',
    rol: 'ADMIN',
    tipo: 'administrador'
  };

  const mockTecnicoUser: User = {
    ...mockAdminUser,
    rol: 'TECNICO',
    tipo: 'trabajador'
  };

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  describe('onSubmit()', () => {
    it('should not call authService.login when form is invalid (empty fields)', () => {
      component.onSubmit();
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should not call authService.login when DNI is invalid format', () => {
      component.loginForm.setValue({
        dni: '1234567', // 7 digits, should be 8
        contrasena: 'password123'
      });

      component.onSubmit();
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should not call authService.login when contrasena is empty', () => {
      component.loginForm.setValue({
        dni: '12345678',
        contrasena: ''
      });

      component.onSubmit();
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should call authService.login with correct credentials when form is valid', () => {
      authServiceMock.login.mockReturnValue(of(mockAdminUser));

      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'password123'
      });

      component.onSubmit();

      expect(authServiceMock.login).toHaveBeenCalledWith({
        dni: '12345678',
        contrasena: 'password123'
      });
    });

    it('should clear errorMessage when submitting', () => {
      authServiceMock.login.mockReturnValue(of(mockAdminUser));
      component.errorMessage = 'Some previous error';

      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'password123'
      });

      component.onSubmit();
      expect(component.errorMessage).toBe('');
    });
  });

  describe('successful login as ADMIN', () => {
    it('should navigate to /admin/dashboard', () => {
      authServiceMock.login.mockReturnValue(of(mockAdminUser));

      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'password123'
      });

      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('should set isLoading to false after successful login', () => {
      authServiceMock.login.mockReturnValue(of(mockAdminUser));

      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'password123'
      });

      component.onSubmit();

      expect(component.isLoading).toBe(false);
    });

    it('should enable form after successful login', () => {
      authServiceMock.login.mockReturnValue(of(mockAdminUser));

      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'password123'
      });

      component.onSubmit();

      expect(component.loginForm.enabled).toBe(true);
    });
  });

  describe('successful login as TECNICO', () => {
    it('should navigate to /worker/profile', () => {
      authServiceMock.login.mockReturnValue(of(mockTecnicoUser));

      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'password123'
      });

      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/worker/profile']);
    });
  });

  describe('successful login as other role', () => {
    it('should navigate to / when role is neither ADMIN nor TECNICO', () => {
      const clienteUser: User = {
        ...mockAdminUser,
        rol: 'CLIENTE',
        tipo: 'cliente'
      };

      authServiceMock.login.mockReturnValue(of(clienteUser));

      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'password123'
      });

      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('login error handling', () => {
    it('should display error message on login failure', () => {
      const errorResponse = { error: { message: 'Credenciales inválidas' } };
      authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'wrongpassword'
      });

      component.onSubmit();

      expect(component.errorMessage).toBe('Credenciales inválidas');
    });

    it('should display generic error message when error has no message', () => {
      const errorResponse = { error: {} };
      authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'wrongpassword'
      });

      component.onSubmit();

      expect(component.errorMessage).toBe('Credenciales inválidas o error de conexión');
    });

    it('should set isLoading to false on error', () => {
      const errorResponse = { error: { message: 'Error' } };
      authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'wrongpassword'
      });

      component.onSubmit();

      expect(component.isLoading).toBe(false);
    });

    it('should enable form on error', () => {
      const errorResponse = { error: { message: 'Error' } };
      authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'wrongpassword'
      });

      component.onSubmit();

      expect(component.loginForm.enabled).toBe(true);
    });

    it('should not navigate on error', () => {
      const errorResponse = { error: { message: 'Error' } };
      authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'wrongpassword'
      });

      component.onSubmit();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('should validate DNI pattern (8 digits)', () => {
      const dniControl = component.loginForm.get('dni');

      dniControl?.setValue('1234567'); // 7 digits
      expect(dniControl?.hasError('pattern')).toBe(true);

      dniControl?.setValue('12345678'); // 8 digits
      expect(dniControl?.hasError('pattern')).toBe(false);

      dniControl?.setValue('abc12345'); // non-numeric
      expect(dniControl?.hasError('pattern')).toBe(true);
    });

    it('should require DNI field', () => {
      const dniControl = component.loginForm.get('dni');

      dniControl?.setValue('');
      expect(dniControl?.hasError('required')).toBe(true);

      dniControl?.setValue('12345678');
      expect(dniControl?.hasError('required')).toBe(false);
    });

    it('should require contrasena field', () => {
      const contrasenaControl = component.loginForm.get('contrasena');

      contrasenaControl?.setValue('');
      expect(contrasenaControl?.hasError('required')).toBe(true);

      contrasenaControl?.setValue('password123');
      expect(contrasenaControl?.hasError('required')).toBe(false);
    });

    it('should have invalid form when any required field is empty', () => {
      component.loginForm.setValue({
        dni: '12345678',
        contrasena: ''
      });
      expect(component.loginForm.invalid).toBe(true);

      component.loginForm.setValue({
        dni: '',
        contrasena: 'password123'
      });
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should have valid form when all fields are correct', () => {
      component.loginForm.setValue({
        dni: '12345678',
        contrasena: 'password123'
      });
      expect(component.loginForm.valid).toBe(true);
    });
  });
});
