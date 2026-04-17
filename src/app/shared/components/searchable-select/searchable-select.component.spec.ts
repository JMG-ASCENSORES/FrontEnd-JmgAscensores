import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { SearchableSelectComponent } from './searchable-select.component';

describe('SearchableSelectComponent', () => {
  let component: SearchableSelectComponent;
  let fixture: ComponentFixture<SearchableSelectComponent>;

  const sampleOptions = [
    { nombre: 'Juan Pérez', codigo: 'JP001' },
    { nombre: 'María García', codigo: 'MG002' },
    { nombre: 'Carlos López', codigo: 'CL003' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchableSelectComponent);
    component = fixture.componentInstance;
    component.label = 'Seleccionar técnico';
    component.options = sampleOptions;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default placeholder "Buscar..."', () => {
    expect(component.placeholder).toBe('Buscar...');
  });

  it('should initialize searchTerm signal as empty string', () => {
    expect(component.searchTerm()).toBe('');
  });

  it('should initialize showDropdown signal as false', () => {
    expect(component.showDropdown()).toBe(false);
  });

  it('filteredOptions should return empty array when searchTerm is empty', () => {
    component.searchTerm.set('');
    expect(component.filteredOptions()).toEqual([]);
  });

  it('filteredOptions should filter options by displayFn when searchTerm is set', () => {
    component.searchTerm.set('juan');
    const result = component.filteredOptions();
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Juan Pérez');
  });

  it('filteredOptions should be case-insensitive', () => {
    component.searchTerm.set('MARÍA');
    const result = component.filteredOptions();
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('María García');
  });

  it('filteredOptions should return multiple matches', () => {
    component.searchTerm.set('a');
    const result = component.filteredOptions();
    expect(result.length).toBeGreaterThan(1);
  });

  it('filteredOptions should return empty array when no matches', () => {
    component.searchTerm.set('zzznomatch');
    const result = component.filteredOptions();
    expect(result).toHaveLength(0);
  });

  it('filteredOptions should filter using subDisplayFn when provided', () => {
    component.subDisplayFn = (item) => item.codigo;
    component.searchTerm.set('CL003');
    const result = component.filteredOptions();
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Carlos López');
  });

  it('selectOption should emit onSelect event with selected option', () => {
    const emitSpy = vi.spyOn(component.onSelect, 'emit');
    const option = sampleOptions[0];
    component.selectOption(option);
    expect(emitSpy).toHaveBeenCalledWith(option);
  });

  it('selectOption should set searchTerm to displayFn result', () => {
    const option = sampleOptions[0];
    component.selectOption(option);
    expect(component.searchTerm()).toBe('Juan Pérez');
  });

  it('selectOption should close the dropdown', () => {
    component.showDropdown.set(true);
    component.selectOption(sampleOptions[0]);
    expect(component.showDropdown()).toBe(false);
  });

  it('onInput should update searchTerm and open dropdown', () => {
    const event = { target: { value: 'Juan' } } as unknown as Event;
    component.onInput(event);
    expect(component.searchTerm()).toBe('Juan');
    expect(component.showDropdown()).toBe(true);
  });

  it('clickout should close dropdown when click is outside the component', () => {
    component.showDropdown.set(true);
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    component.clickout({ target: outsideElement });
    expect(component.showDropdown()).toBe(false);
    document.body.removeChild(outsideElement);
  });

  it('clickout should not close dropdown when click is inside the component', () => {
    component.showDropdown.set(true);
    const insideElement = fixture.nativeElement;
    component.clickout({ target: insideElement });
    expect(component.showDropdown()).toBe(true);
  });
});
