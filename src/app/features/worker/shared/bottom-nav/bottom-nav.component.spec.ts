import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture, NO_ERRORS_SCHEMA } from '@angular/core/testing';
import { BottomNavComponent } from './bottom-nav.component';

describe('BottomNavComponent', () => {
  let component: BottomNavComponent;
  let fixture: ComponentFixture<BottomNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNavComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BottomNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have exactly 4 nav items', () => {
    expect(component.navItems.length).toBe(4);
  });

  it('each nav item should have path, label, icon, and iconActive', () => {
    component.navItems.forEach(item => {
      expect(item.path).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
      expect(item.iconActive).toBeTruthy();
    });
  });

  it('should have equipment nav item as first item', () => {
    const equipmentItem = component.navItems[0];
    expect(equipmentItem.path).toBe('/worker/equipment');
    expect(equipmentItem.label).toBe('EQUIPOS');
    expect(equipmentItem.icon).toBe('bi-gear');
    expect(equipmentItem.iconActive).toBe('bi-gear-fill');
  });

  it('should have reports nav item as second item', () => {
    const reportsItem = component.navItems[1];
    expect(reportsItem.path).toBe('/worker/reports');
    expect(reportsItem.label).toBe('INFORMES');
    expect(reportsItem.icon).toBe('bi-file-earmark-text');
    expect(reportsItem.iconActive).toBe('bi-file-earmark-text-fill');
  });

  it('should have routes nav item as third item', () => {
    const routesItem = component.navItems[2];
    expect(routesItem.path).toBe('/worker/routes');
    expect(routesItem.label).toBe('RUTAS');
    expect(routesItem.icon).toBe('bi-geo-alt');
    expect(routesItem.iconActive).toBe('bi-geo-alt-fill');
  });

  it('should have profile nav item as fourth item', () => {
    const profileItem = component.navItems[3];
    expect(profileItem.path).toBe('/worker/profile');
    expect(profileItem.label).toBe('PERFIL');
    expect(profileItem.icon).toBe('bi-person');
    expect(profileItem.iconActive).toBe('bi-person-fill');
  });
});
