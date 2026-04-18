import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { PlaceholderPageComponent } from './placeholder-page.component';

describe('PlaceholderPageComponent', () => {
  let component: PlaceholderPageComponent;
  let fixture: ComponentFixture<PlaceholderPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaceholderPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaceholderPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title "Próximamente"', () => {
    expect(component.title).toBe('Próximamente');
  });

  it('should have default icon "bi bi-tools"', () => {
    expect(component.icon).toBe('bi bi-tools');
  });

  it('should accept custom title', () => {
    component.title = 'Clientes';
    expect(component.title).toBe('Clientes');
  });

  it('should accept custom icon', () => {
    component.icon = 'bi bi-people';
    expect(component.icon).toBe('bi bi-people');
  });

  it('should render title in template', () => {
    fixture.componentRef.setInput('title', 'Reportes');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Reportes');
  });
});
