import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default size "md"', () => {
    expect(component.size).toBe('md');
  });

  it('should have default message null', () => {
    expect(component.message).toBeNull();
  });

  it('should have default overlay false', () => {
    expect(component.overlay).toBe(false);
  });

  it('should have default containerClass "loading-container"', () => {
    expect(component.containerClass).toBe('loading-container');
  });

  it('should accept size "sm"', () => {
    component.size = 'sm';
    expect(component.size).toBe('sm');
  });

  it('should accept size "lg"', () => {
    component.size = 'lg';
    expect(component.size).toBe('lg');
  });

  it('should accept a string message', () => {
    component.message = 'Cargando...';
    expect(component.message).toBe('Cargando...');
  });

  it('should accept null as message', () => {
    component.message = null;
    expect(component.message).toBeNull();
  });

  it('should accept overlay true', () => {
    component.overlay = true;
    expect(component.overlay).toBe(true);
  });

  it('should accept custom containerClass', () => {
    component.containerClass = 'custom-class';
    expect(component.containerClass).toBe('custom-class');
  });
});
