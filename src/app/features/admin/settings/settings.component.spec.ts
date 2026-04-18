import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../../../core/services/auth.service';
import { ConfiguracionService } from '../services/configuracion.service';

const mockProfile = {
  nombre: 'Juan',
  apellido: 'Perez',
  dni: '12345678',
  correo: 'juan@test.com',
  telefono: '987654321'
};

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let configServiceMock: any;
  let authServiceMock: any;

  beforeEach(async () => {
    configServiceMock = {
      getProfile: vi.fn().mockReturnValue(of({ data: mockProfile })),
      getSystemSettings: vi.fn().mockReturnValue(of({ data: [] })),
      updateProfile: vi.fn().mockReturnValue(of({ data: mockProfile })),
      updateSystemSetting: vi.fn().mockReturnValue(of({}))
    };

    authServiceMock = {
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, ReactiveFormsModule],
      providers: [
        { provide: ConfiguracionService, useValue: configServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load profile on init and patch form', () => {
    expect(configServiceMock.getProfile).toHaveBeenCalled();
    expect(component.profile()).toEqual(mockProfile);
    expect(component.profileForm.get('nombre')?.value).toBe('Juan');
  });

  it('should set error message when getProfile fails', async () => {
    configServiceMock.getProfile.mockReturnValue(throwError(() => new Error('Network error')));
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, ReactiveFormsModule],
      providers: [
        { provide: ConfiguracionService, useValue: configServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    const f2 = TestBed.createComponent(SettingsComponent);
    const c2 = f2.componentInstance;
    f2.detectChanges();

    expect(c2.errorMessage()).toBe('Error al cargar el perfil');
  });

  it('should compute initials from profile', () => {
    expect(component.initials).toBe('JP');
  });

  it('onSaveProfile() should not call updateProfile when form is invalid', () => {
    component.profileForm.get('nombre')?.setValue('');
    component.onSaveProfile();
    expect(configServiceMock.updateProfile).not.toHaveBeenCalled();
  });

  it('onSaveProfile() should call updateProfile and set saveSuccess when form is valid', () => {
    component.profileForm.patchValue({
      nombre: 'Juan',
      apellido: 'Perez',
      dni: '12345678',
      correo: 'juan@test.com',
      telefono: '987654321'
    });
    component.onSaveProfile();
    expect(configServiceMock.updateProfile).toHaveBeenCalled();
    expect(component.saveSuccess()).toBe(true);
  });

  it('onSaveProfile() should set errorMessage on update error', () => {
    configServiceMock.updateProfile.mockReturnValue(throwError(() => ({ error: { message: 'Error de servidor' } })));
    component.profileForm.patchValue({
      nombre: 'Juan',
      apellido: 'Perez',
      dni: '12345678',
      correo: 'juan@test.com',
      telefono: '987654321'
    });
    component.onSaveProfile();
    expect(component.errorMessage()).toBe('Error de servidor');
  });

  it('onChangePassword() should not call updateProfile when passwordForm is invalid', () => {
    component.passwordForm.get('nueva_contrasena')?.setValue('');
    component.onChangePassword();
    expect(configServiceMock.updateProfile).not.toHaveBeenCalled();
  });

  it('activeTab defaults to profile', () => {
    expect(component.activeTab()).toBe('profile');
  });

  it('updateSystemSetting should call configService.updateSystemSetting', () => {
    const mockEvent = { target: { value: 'new_value' } };
    component.updateSystemSetting('some_key', mockEvent);
    expect(configServiceMock.updateSystemSetting).toHaveBeenCalledWith('some_key', 'new_value');
  });
});
