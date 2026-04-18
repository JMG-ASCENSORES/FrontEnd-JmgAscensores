import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { WorkerProfileComponent } from './worker-profile.component';
import { WorkerService } from '../services/worker.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';

vi.mock('signature_pad', () => ({
  default: vi.fn().mockImplementation(() => ({
    isEmpty: vi.fn(() => true),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    clear: vi.fn(),
  }))
}));

const mockProfile = {
  nombre: 'Juan',
  apellido: 'Perez',
  correo: 'juan@example.com',
  telefono: '987654321',
  firma_defecto_id: null,
  firma_defecto_base64: null
};

describe('WorkerProfileComponent', () => {
  let component: WorkerProfileComponent;
  let fixture: ComponentFixture<WorkerProfileComponent>;
  let workerServiceMock: any;
  let authServiceMock: any;

  beforeEach(async () => {
    workerServiceMock = {
      getMyProfile: vi.fn().mockReturnValue(of(mockProfile)),
      updateMyProfile: vi.fn().mockReturnValue(of(mockProfile))
    };

    authServiceMock = {
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [WorkerProfileComponent, ReactiveFormsModule],
      providers: [
        { provide: WorkerService, useValue: workerServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('loadProfile()', () => {
    it('should set profile signal on success', () => {
      expect(component.profile()).toEqual(mockProfile);
    });

    it('should patch profileForm values on success', () => {
      expect(component.profileForm.get('nombre')?.value).toBe('Juan');
      expect(component.profileForm.get('apellido')?.value).toBe('Perez');
      expect(component.profileForm.get('correo')?.value).toBe('juan@example.com');
      expect(component.profileForm.get('telefono')?.value).toBe('987654321');
    });

    it('should set isLoading to false on success', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should set errorMessage on error', () => {
      workerServiceMock.getMyProfile.mockReturnValue(throwError(() => new Error('Network error')));
      component.loadProfile();
      expect(component.errorMessage()).toBe('No se pudo cargar el perfil. Intenta nuevamente.');
    });

    it('should set isLoading to false on error', () => {
      workerServiceMock.getMyProfile.mockReturnValue(throwError(() => new Error('Network error')));
      component.loadProfile();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('onSaveProfile()', () => {
    it('should not call workerService if form is invalid', () => {
      component.profileForm.get('nombre')?.setValue('');
      component.profileForm.get('correo')?.setValue('invalid-email');
      workerServiceMock.updateMyProfile.mockClear();
      component.onSaveProfile();
      expect(workerServiceMock.updateMyProfile).not.toHaveBeenCalled();
    });

    it('should set saveSuccess to true on success', () => {
      component.profileForm.patchValue({
        nombre: 'Juan',
        apellido: 'Perez',
        correo: 'juan@example.com'
      });
      workerServiceMock.updateMyProfile.mockReturnValue(of(mockProfile));
      component.onSaveProfile();
      expect(component.saveSuccess()).toBe(true);
    });

    it('should set isSaving to false on success', () => {
      component.profileForm.patchValue({
        nombre: 'Juan',
        apellido: 'Perez',
        correo: 'juan@example.com'
      });
      workerServiceMock.updateMyProfile.mockReturnValue(of(mockProfile));
      component.onSaveProfile();
      expect(component.isSaving()).toBe(false);
    });

    it('should set errorMessage on error', () => {
      component.profileForm.patchValue({
        nombre: 'Juan',
        apellido: 'Perez',
        correo: 'juan@example.com'
      });
      workerServiceMock.updateMyProfile.mockReturnValue(throwError(() => new Error('Server error')));
      component.onSaveProfile();
      expect(component.errorMessage()).toBe('Error al guardar los cambios. Intenta nuevamente.');
    });

    it('should set isSaving to false on error', () => {
      component.profileForm.patchValue({
        nombre: 'Juan',
        apellido: 'Perez',
        correo: 'juan@example.com'
      });
      workerServiceMock.updateMyProfile.mockReturnValue(throwError(() => new Error('Server error')));
      component.onSaveProfile();
      expect(component.isSaving()).toBe(false);
    });
  });

  describe('onChangePassword()', () => {
    it('should not call workerService if passwordForm is invalid', () => {
      component.passwordForm.get('nueva_contrasena')?.setValue('');
      component.passwordForm.get('confirmar_contrasena')?.setValue('');
      workerServiceMock.updateMyProfile.mockClear();
      component.onChangePassword();
      expect(workerServiceMock.updateMyProfile).not.toHaveBeenCalled();
    });

    it('should reset form and hide section on success', () => {
      component.showPasswordSection.set(true);
      component.passwordForm.patchValue({
        nueva_contrasena: 'password123',
        confirmar_contrasena: 'password123'
      });
      workerServiceMock.updateMyProfile.mockReturnValue(of({}));
      component.onChangePassword();
      expect(component.showPasswordSection()).toBe(false);
      expect(component.passwordForm.get('nueva_contrasena')?.value).toBeFalsy();
    });

    it('should set saveSuccess to true on success', () => {
      component.passwordForm.patchValue({
        nueva_contrasena: 'password123',
        confirmar_contrasena: 'password123'
      });
      workerServiceMock.updateMyProfile.mockReturnValue(of({}));
      component.onChangePassword();
      expect(component.saveSuccess()).toBe(true);
    });
  });

  describe('logout()', () => {
    it('should call authService.logout()', () => {
      component.logout();
      expect(authServiceMock.logout).toHaveBeenCalledOnce();
    });
  });

  describe('initials getter', () => {
    it('should return initials from profile', () => {
      component.profile.set({ nombre: 'Juan', apellido: 'Perez', correo: 'j@j.com' } as any);
      expect(component.initials).toBe('JP');
    });

    it("should return '?' if profile is null", () => {
      component.profile.set(null);
      expect(component.initials).toBe('?');
    });

    it('should return uppercase initials', () => {
      component.profile.set({ nombre: 'ana', apellido: 'garcia', correo: 'a@g.com' } as any);
      expect(component.initials).toBe('AG');
    });
  });

  describe('passwordMatchValidator', () => {
    it('should return null when passwords match', () => {
      component.passwordForm.patchValue({
        nueva_contrasena: 'password123',
        confirmar_contrasena: 'password123'
      });
      expect(component.passwordForm.errors).toBeNull();
    });

    it('should return passwordMismatch error when passwords do not match', () => {
      component.passwordForm.patchValue({
        nueva_contrasena: 'password123',
        confirmar_contrasena: 'differentpassword'
      });
      expect(component.passwordForm.errors).toEqual({ passwordMismatch: true });
    });
  });
});
