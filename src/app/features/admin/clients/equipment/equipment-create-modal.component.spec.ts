import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EquipmentCreateModalComponent } from './equipment-create-modal.component';
import { ElevatorService } from '../../services/elevator.service';

describe('EquipmentCreateModalComponent', () => {
  let component: EquipmentCreateModalComponent;
  let fixture: ComponentFixture<EquipmentCreateModalComponent>;
  let elevatorServiceMock: any;

  beforeEach(async () => {
    elevatorServiceMock = {
      createElevator: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [EquipmentCreateModalComponent],
      providers: [{ provide: ElevatorService, useValue: elevatorServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentCreateModalComponent);
    component = fixture.componentInstance;
    component.client = { cliente_id: 5, nombre_comercial: 'Test SA' } as any;
    component.equipmentType = 'Ascensor';
    fixture.detectChanges();
  });

  it('tiene valores por defecto correctos en el formulario', () => {
    expect(component.equipmentForm.get('estado')?.value).toBe('Activo');
    expect(component.equipmentForm.get('tipo_equipo')?.value).toBe('Ascensor');
  });

  it('onSubmit con formulario inválido no llama createElevator', () => {
    component.equipmentForm.get('marca')?.setValue('');
    component.onSubmit();
    expect(elevatorServiceMock.createElevator).not.toHaveBeenCalled();
  });

  it('onSubmit exitoso emite equipmentCreated y close', () => {
    const created: void[] = [];
    const closed: void[] = [];
    component.equipmentCreated.subscribe(() => created.push());
    component.close.subscribe(() => closed.push());

    component.equipmentForm.patchValue({ marca: 'Otis', tipo_equipo: 'Ascensor', estado: 'Operativo' });
    component.onSubmit();

    expect(elevatorServiceMock.createElevator).toHaveBeenCalled();
    expect(created.length).toBe(1);
    expect(closed.length).toBe(1);
  });

  it('onSubmit error sets errorMessage', () => {
    elevatorServiceMock.createElevator.mockReturnValue(throwError(() => ({ message: 'Fallo al crear' })));
    component.equipmentForm.patchValue({ marca: 'Otis', tipo_equipo: 'Ascensor', estado: 'Operativo' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Fallo al crear');
    expect(component.isSubmitting()).toBe(false);
  });

  it('onClose emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push());
    component.onClose();
    expect(emitted.length).toBe(1);
  });
});
