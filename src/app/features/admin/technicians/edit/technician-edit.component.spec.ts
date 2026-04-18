import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TechnicianEditComponent } from './technician-edit.component';
import { TechnicianService } from '../../services/technician.service';

describe('TechnicianEditComponent', () => {
  let component: TechnicianEditComponent;
  let fixture: ComponentFixture<TechnicianEditComponent>;
  let techServiceMock: any;

  const mockTech = {
    id: 1, nombre: 'Juan', apellido: 'Pérez', dni: '12345678',
    edad: 35, correo: 'juan@test.com', telefono: '912345678',
    especialidad: 'Técnico General', estado_activo: true,
  } as any;

  beforeEach(async () => {
    techServiceMock = {
      updateTechnician: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [TechnicianEditComponent],
      providers: [{ provide: TechnicianService, useValue: techServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TechnicianEditComponent);
    component = fixture.componentInstance;
    component.technician = mockTech;
    fixture.detectChanges();
  });

  it('inicializa el formulario con los datos del técnico', () => {
    expect(component.technicianForm.get('nombre')?.value).toBe('Juan');
    expect(component.technicianForm.get('especialidad')?.value).toBe('Técnico General');
  });

  it('onSubmit con formulario inválido no llama updateTechnician', () => {
    component.technicianForm.get('nombre')?.setValue('');
    component.onSubmit();
    expect(techServiceMock.updateTechnician).not.toHaveBeenCalled();
  });

  it('onSubmit exitoso emite technicianUpdated y close', () => {
    const updated: void[] = [];
    const closed: void[] = [];
    component.technicianUpdated.subscribe(() => updated.push(undefined));
    component.close.subscribe(() => closed.push(undefined));

    component.onSubmit();

    expect(techServiceMock.updateTechnician).toHaveBeenCalledWith(1, expect.any(Object));
    expect(updated.length).toBe(1);
    expect(closed.length).toBe(1);
  });

  it('onSubmit error sets errorMessage', () => {
    techServiceMock.updateTechnician.mockReturnValue(throwError(() => new Error('fail')));
    component.onSubmit();
    expect(component.errorMessage()).toContain('Error al actualizar');
  });

  it('onClose emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push(undefined));
    component.onClose();
    expect(emitted.length).toBe(1);
  });
});
