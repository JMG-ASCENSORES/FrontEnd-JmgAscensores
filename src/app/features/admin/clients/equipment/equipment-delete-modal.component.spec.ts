import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EquipmentDeleteModalComponent } from './equipment-delete-modal.component';
import { ElevatorService } from '../../services/elevator.service';

describe('EquipmentDeleteModalComponent', () => {
  let component: EquipmentDeleteModalComponent;
  let fixture: ComponentFixture<EquipmentDeleteModalComponent>;
  let elevatorServiceMock: any;

  beforeEach(async () => {
    elevatorServiceMock = {
      deleteElevator: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [EquipmentDeleteModalComponent],
      providers: [{ provide: ElevatorService, useValue: elevatorServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentDeleteModalComponent);
    component = fixture.componentInstance;
    component.equipment = { ascensor_id: 10, tipo_equipo: 'Ascensor', marca: 'Otis' } as any;
    fixture.detectChanges();
  });

  it('onDelete llama deleteElevator con el id correcto y emite equipmentDeleted', () => {
    const emitted: void[] = [];
    component.equipmentDeleted.subscribe(() => emitted.push(undefined));
    component.onDelete();
    expect(elevatorServiceMock.deleteElevator).toHaveBeenCalledWith(10);
    expect(emitted.length).toBe(1);
  });

  it('onDelete sets isDeleting=false al completar', () => {
    component.onDelete();
    expect(component.isDeleting()).toBe(false);
  });

  it('onDelete sets errorMessage cuando falla', () => {
    elevatorServiceMock.deleteElevator.mockReturnValue(throwError(() => ({ message: 'Error del servidor' })));
    component.onDelete();
    expect(component.errorMessage()).toBe('Error del servidor');
    expect(component.isDeleting()).toBe(false);
  });

  it('onClose emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push(undefined));
    component.onClose();
    expect(emitted.length).toBe(1);
  });
});
