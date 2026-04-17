import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AdminLayoutComponent } from './admin-layout.component';
import { AuthService } from '../../../core/services/auth.service';
import { RouterModule } from '@angular/router';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent, RouterModule.forRoot([])],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with showLogoutModal as false', () => {
    expect(component.showLogoutModal).toBe(false);
  });

  it('logout() should set showLogoutModal to true', () => {
    component.logout();
    expect(component.showLogoutModal).toBe(true);
  });

  it('confirmLogout() should call authService.logout and set showLogoutModal to false', () => {
    component.showLogoutModal = true;
    component.confirmLogout();
    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(component.showLogoutModal).toBe(false);
  });

  it('cancelLogout() should set showLogoutModal to false', () => {
    component.showLogoutModal = true;
    component.cancelLogout();
    expect(component.showLogoutModal).toBe(false);
  });

  it('confirmLogout() should not leave showLogoutModal true after call', () => {
    component.logout();
    expect(component.showLogoutModal).toBe(true);
    component.confirmLogout();
    expect(component.showLogoutModal).toBe(false);
  });
});
