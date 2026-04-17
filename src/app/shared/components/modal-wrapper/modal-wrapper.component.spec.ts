import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { ModalWrapperComponent } from './modal-wrapper.component';

describe('ModalWrapperComponent', () => {
  let component: ModalWrapperComponent;
  let fixture: ComponentFixture<ModalWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalWrapperComponent);
    component = fixture.componentInstance;
    component.title = 'Modal de prueba';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default variant "neutral"', () => {
    expect(component.variant).toBe('neutral');
  });

  it('should have default size "md"', () => {
    expect(component.size).toBe('md');
  });

  it('should have subtitle undefined by default', () => {
    expect(component.subtitle).toBeUndefined();
  });

  it('maxWidthClass should return "max-w-sm" for size "sm"', () => {
    component.size = 'sm';
    expect(component.maxWidthClass).toBe('max-w-sm');
  });

  it('maxWidthClass should return "max-w-md" for size "md"', () => {
    component.size = 'md';
    expect(component.maxWidthClass).toBe('max-w-md');
  });

  it('maxWidthClass should return "max-w-2xl" for size "lg"', () => {
    component.size = 'lg';
    expect(component.maxWidthClass).toBe('max-w-2xl');
  });

  it('maxWidthClass should return "max-w-4xl" for size "xl"', () => {
    component.size = 'xl';
    expect(component.maxWidthClass).toBe('max-w-4xl');
  });

  it('should accept variant "primary"', () => {
    component.variant = 'primary';
    fixture.detectChanges();
    expect(component.variant).toBe('primary');
  });

  it('should accept variant "danger"', () => {
    component.variant = 'danger';
    fixture.detectChanges();
    expect(component.variant).toBe('danger');
  });

  it('should accept subtitle', () => {
    component.subtitle = 'Subtítulo de prueba';
    fixture.detectChanges();
    expect(component.subtitle).toBe('Subtítulo de prueba');
  });

  it('close output should emit when called', () => {
    const emitSpy = vi.spyOn(component.close, 'emit');
    component.close.emit();
    expect(emitSpy).toHaveBeenCalled();
  });
});
