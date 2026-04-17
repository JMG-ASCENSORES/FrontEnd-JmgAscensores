import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EquipmentEditModalComponent } from './equipment-edit-modal.component';
import { ElevatorService } from '../../services/elevator.service';

describe('EquipmentEditModalComponent', () => {
  let component: EquipmentEditModalComponent;
  let fixture: ComponentFixture<EquipmentEditModalComponent>;
  let elevatorServiceMock: any;

  const mockEquipment = {
    ascensor_id: 10,
    tipo_equipo: 'Ascensor',
    marca: 'Otis',
    modelo: 'Gen2',
    numero_serie: 'SN001',
    estado: 'Operativo',
    capacidad_kg: 630,
    capacidad_personas: 8,
    piso_cantidad: 10,
    observaciones: '',
  } as any;

  beforeEach(async () => {
    elevatorServiceMock = {
      updateElevator: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [EquipmentEditModalComponent],
      providers: [{ provide: ElevatorService, useValue: elevatorServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentEditModalComponent);
    component = fixture.componentInstance;
    component.equipment = mockEquipment;
    fixture.detectChanges();
  });

  it('inicializa el formulario con los datos del equipamiento', () => {
    expect(component.equipmentForm.get('marca')?.value).toBe('Otis');
    expect(component.equipmentForm.get('estado')?.value).toBe('Operativo');
  });

  it('onSubmit con formulario inválido no llama updateElevator', () => {
    component.equipmentForm.get('marca')?.setValue('');
    component.onSubmit();
    expect(elevatorServiceMock.updateElevator).not.toHaveBeenCalled();
  });

  it('onSubmit exitoso emite equipmentUpdated y close', () => {
    const updated: void[] = [];
    const closed: void[] = [];
    component.equipmentUpdated.subscribe(() => updated.push());
    component.close.subscribe(() => closed.push());

    component.onSubmit();

    expect(elevatorServiceMock.updateElevator).toHaveBeenCalledWith(10, expect.any(Object));
    expect(updated.length).toBe(1);
    expect(closed.length).toBe(1);
  });

  it('onSubmit error sets errorMessage', () => {
    elevatorServiceMock.updateElevator.mockReturnValue(throwError(() => ({ message: 'Error update' })));
    component.onSubmit();
    expect(component.errorMessage()).toBe('Error update');
  });

  it('isFormValid retorna true con formulario válido', () => {
    expect(component.isFormValid()).toBe(true);
  });

  it('onClose emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push());
    component.onClose();
    expect(emitted.length).toBe(1);
  });
});
