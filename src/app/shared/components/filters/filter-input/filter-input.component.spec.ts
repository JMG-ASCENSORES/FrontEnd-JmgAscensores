import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { FilterInputComponent } from './filter-input.component';

describe('FilterInputComponent', () => {
  let component: FilterInputComponent;
  let fixture: ComponentFixture<FilterInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default label "Búsqueda"', () => {
    expect(component.label).toBe('Búsqueda');
  });

  it('should have default placeholder "Buscar..."', () => {
    expect(component.placeholder).toBe('Buscar...');
  });

  it('should have default iconClass "bi bi-search text-gray-400 text-lg"', () => {
    expect(component.iconClass).toBe('bi bi-search text-gray-400 text-lg');
  });

  it('should have signal value initialized to empty string', () => {
    expect(component.value()).toBe('');
  });

  it('should accept custom label', () => {
    component.label = 'Nombre del cliente';
    fixture.detectChanges();
    expect(component.label).toBe('Nombre del cliente');
  });

  it('should accept custom placeholder', () => {
    component.placeholder = 'Ingrese un nombre...';
    fixture.detectChanges();
    expect(component.placeholder).toBe('Ingrese un nombre...');
  });

  it('should accept custom iconClass', () => {
    component.iconClass = 'bi bi-person text-blue-500';
    fixture.detectChanges();
    expect(component.iconClass).toBe('bi bi-person text-blue-500');
  });
});
