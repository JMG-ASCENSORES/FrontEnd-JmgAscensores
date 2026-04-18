import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EquipmentListModalComponent } from './equipment-list-modal.component';
import { ElevatorService } from '../../services/elevator.service';

describe('EquipmentListModalComponent', () => {
  let component: EquipmentListModalComponent;
  let fixture: ComponentFixture<EquipmentListModalComponent>;
  let elevatorServiceMock: any;

  const mockElevators = [
    { ascensor_id: 1, cliente_id: 5, tipo_equipo: 'Ascensor', marca: 'Otis', estado: 'activo' },
    { ascensor_id: 2, cliente_id: 5, tipo_equipo: 'Montacarga', marca: 'Kone', estado: 'activo' },
  ];

  beforeEach(async () => {
    elevatorServiceMock = {
      getElevators: vi.fn().mockReturnValue(of(mockElevators)),
    };

    await TestBed.configureTestingModule({
      imports: [EquipmentListModalComponent],
      providers: [{ provide: ElevatorService, useValue: elevatorServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentListModalComponent);
    component = fixture.componentInstance;
    component.client = { cliente_id: 5, nombre_comercial: 'Test SA' } as any;
    component.equipmentType = 'ascensor';
    fixture.detectChanges();
  });

  it('carga y filtra equipos por tipo al iniciar', () => {
    expect(elevatorServiceMock.getElevators).toHaveBeenCalledWith(5);
    expect(component.equipments().length).toBe(1);
    expect(component.equipments()[0].tipo_equipo).toBe('Ascensor');
  });

  it('sets errorMessage cuando getElevators falla', () => {
    elevatorServiceMock.getElevators.mockReturnValue(throwError(() => ({ message: 'Error carga' })));
    component.loadEquipments();
    expect(component.errorMessage()).toBe('Error carga');
  });

  it('onClose emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push(undefined));
    component.onClose();
    expect(emitted.length).toBe(1);
  });

  it('openCreateModal sets showCreateModal=true', () => {
    component.openCreateModal();
    expect(component.showCreateModal()).toBe(true);
  });

  it('closeCreateModal sets showCreateModal=false', () => {
    component.showCreateModal.set(true);
    component.closeCreateModal();
    expect(component.showCreateModal()).toBe(false);
  });

  it('openEditModal sets selectedEquipment', () => {
    const equip = mockElevators[0] as any;
    component.openEditModal(equip);
    expect(component.selectedEquipment()).toEqual(equip);
    expect(component.showEditModal()).toBe(true);
  });

  it('openDeleteModal sets selectedEquipment y showDeleteModal=true', () => {
    const equip = mockElevators[0] as any;
    component.openDeleteModal(equip);
    expect(component.selectedEquipment()).toEqual(equip);
    expect(component.showDeleteModal()).toBe(true);
  });

  it('getEquipmentTypeLabel retorna label correcto', () => {
    component.equipmentType = 'ascensor';
    expect(component.getEquipmentTypeLabel()).toBe('Ascensores');
    component.equipmentType = 'montacarga';
    expect(component.getEquipmentTypeLabel()).toBe('Montacargas');
    component.equipmentType = 'desconocido';
    expect(component.getEquipmentTypeLabel()).toBe('Equipos');
  });
});
