import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TechnicianCreateComponent } from './technician-create.component';
import { TechnicianService } from '../../services/technician.service';

describe('TechnicianCreateComponent', () => {
  let component: TechnicianCreateComponent;
  let fixture: ComponentFixture<TechnicianCreateComponent>;
  let techServiceMock: any;

  beforeEach(async () => {
    techServiceMock = {
      createTechnician: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [TechnicianCreateComponent],
      providers: [{ provide: TechnicianService, useValue: techServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TechnicianCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('tiene especialidad "Técnico General" por defecto', () => {
    expect(component.technicianForm.get('especialidad')?.value).toBe('Técnico General');
  });

  it('tiene 4 opciones de especialidades', () => {
    expect(component.specialties.length).toBe(4);
  });

  it('onSubmit con formulario inválido no llama createTechnician', () => {
    component.onSubmit();
    expect(techServiceMock.createTechnician).not.toHaveBeenCalled();
  });

  it('onSubmit exitoso emite technicianCreated y close', () => {
    const created: void[] = [];
    const closed: void[] = [];
    component.technicianCreated.subscribe(() => created.push(undefined));
    component.close.subscribe(() => closed.push(undefined));

    component.technicianForm.patchValue({
      nombre: 'Carlos', apellido: 'Rojas', dni: '12345678',
      edad: 30, correo: 'carlos@test.com', telefono: '912345678',
      password: 'pass123', especialidad: 'Técnico General',
    });
    component.onSubmit();

    expect(techServiceMock.createTechnician).toHaveBeenCalled();
    expect(created.length).toBe(1);
    expect(closed.length).toBe(1);
  });

  it('onSubmit error sets errorMessage', () => {
    techServiceMock.createTechnician.mockReturnValue(throwError(() => new Error('fail')));
    component.technicianForm.patchValue({
      nombre: 'Carlos', apellido: 'Rojas', dni: '12345678',
      edad: 30, correo: 'carlos@test.com', telefono: '912345678',
      password: 'pass123', especialidad: 'Técnico General',
    });
    component.onSubmit();
    expect(component.errorMessage()).toContain('Error al registrar');
    expect(component.isSubmitting()).toBe(false);
  });

  it('onClose emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push(undefined));
    component.onClose();
    expect(emitted.length).toBe(1);
  });
});
