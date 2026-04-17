import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { FilterSelectComponent } from './filter-select.component';

describe('FilterSelectComponent', () => {
  let component: FilterSelectComponent;
  let fixture: ComponentFixture<FilterSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default label as empty string', () => {
    expect(component.label).toBe('');
  });

  it('should have default placeholder "Seleccionar..."', () => {
    expect(component.placeholder).toBe('Seleccionar...');
  });

  it('should have default options as empty array', () => {
    expect(component.options).toEqual([]);
  });

  it('should have signal value initialized to empty string', () => {
    expect(component.value()).toBe('');
  });

  it('should accept an array of string options', () => {
    component.options = ['Opción 1', 'Opción 2', 'Opción 3'];
    fixture.detectChanges();
    expect(component.options).toHaveLength(3);
  });

  it('should accept empty array for options', () => {
    component.options = [];
    fixture.detectChanges();
    expect(component.options).toHaveLength(0);
  });

  it('should accept custom label', () => {
    component.label = 'Estado';
    fixture.detectChanges();
    expect(component.label).toBe('Estado');
  });

  it('should accept custom placeholder', () => {
    component.placeholder = 'Elige una opción';
    fixture.detectChanges();
    expect(component.placeholder).toBe('Elige una opción');
  });
});
