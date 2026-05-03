import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  const mockAuthService = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start collapsed (isCollapsed = true)', () => {
    expect(component.isCollapsed).toBe(true);
  });

  it('toggleSidebar should change isCollapsed from true to false', () => {
    component.isCollapsed = true;
    component.toggleSidebar();
    expect(component.isCollapsed).toBe(false);
  });

  it('toggleSidebar should change isCollapsed from false to true', () => {
    component.isCollapsed = false;
    component.toggleSidebar();
    expect(component.isCollapsed).toBe(true);
  });

  it('toggleSidebar should toggle isCollapsed on each call', () => {
    expect(component.isCollapsed).toBe(true);
    component.toggleSidebar();
    expect(component.isCollapsed).toBe(false);
    component.toggleSidebar();
    expect(component.isCollapsed).toBe(true);
  });

  it('logout should emit logoutRequest event', () => {
    const emitSpy = vi.spyOn(component.logoutRequest, 'emit');
    component.logout();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('menuItems should have 9 items by default', () => {
    expect(component.menuItems).toHaveLength(9);
  });

  it('menuItems should contain expected routes', () => {
    const routes = component.menuItems.map((item) => item.route);
    expect(routes).toContain('/admin/dashboard');
    expect(routes).toContain('/admin/clients');
    expect(routes).toContain('/admin/technicians');
    expect(routes).toContain('/admin/maintenance');
    expect(routes).toContain('/admin/elevators');
    expect(routes).toContain('/admin/documents');
    expect(routes).toContain('/admin/reports');
    expect(routes).toContain('/admin/ai-assistant');
    expect(routes).toContain('/admin/settings');
  });

  it('each menuItem should have label, icon, and route', () => {
    component.menuItems.forEach((item) => {
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
      expect(item.route).toBeTruthy();
    });
  });
});
