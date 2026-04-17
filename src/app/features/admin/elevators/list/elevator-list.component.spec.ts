import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ElevatorListComponent } from './elevator-list.component';
import { ElevatorService } from '../../services/elevator.service';
import { ClientService } from '../../services/client.service';

describe('ElevatorListComponent', () => {
  let component: ElevatorListComponent;
  let fixture: ComponentFixture<ElevatorListComponent>;
  let elevatorServiceMock: any;
  let clientServiceMock: any;

  const mockPaginatedResponse = {
    data: [
      { ascensor_id: 1, cliente_id: 1, tipo_equipo: 'Ascensor', marca: 'Otis', estado: 'Operativo', Cliente: { cliente_id: 1, nombre_comercial: 'Empresa A' } },
    ],
    meta: { totalItems: 1, totalPages: 1 },
  };

  beforeEach(async () => {
    elevatorServiceMock = {
      getElevatorsPaginated: vi.fn().mockReturnValue(of(mockPaginatedResponse)),
    };
    clientServiceMock = {};

    await TestBed.configureTestingModule({
      imports: [ElevatorListComponent],
      providers: [
        { provide: ElevatorService, useValue: elevatorServiceMock },
        { provide: ClientService, useValue: clientServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ElevatorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga elevadores al iniciar', () => {
    expect(elevatorServiceMock.getElevatorsPaginated).toHaveBeenCalled();
    expect(component.elevators().length).toBe(1);
    expect(component.isLoading()).toBe(false);
  });

  it('sets error cuando loadData falla', () => {
    elevatorServiceMock.getElevatorsPaginated.mockReturnValue(throwError(() => ({ message: 'Error' })));
    component.loadData();
    expect(component.error()).toBe('Error');
    expect(component.isLoading()).toBe(false);
  });

  it('nextPage incrementa currentPage si < totalPages', () => {
    component.currentPage.set(1);
    component.totalPages.set(3);
    component.nextPage();
    expect(component.currentPage()).toBe(2);
  });

  it('prevPage decrementa si > 1', () => {
    component.currentPage.set(2);
    component.prevPage();
    expect(component.currentPage()).toBe(1);
  });

  it('openCreateModal sets showCreateModal=true', () => {
    component.openCreateModal();
    expect(component.showCreateModal()).toBe(true);
  });

  it('openEditModal sets selectedElevator', () => {
    const elev = { ascensor_id: 1 } as any;
    component.openEditModal(elev);
    expect(component.selectedElevator()).toEqual(elev);
    expect(component.showEditModal()).toBe(true);
  });

  it('closeEditModal limpia selectedElevator', () => {
    component.selectedElevator.set({ ascensor_id: 1 } as any);
    component.closeEditModal();
    expect(component.selectedElevator()).toBeNull();
  });

  it('getStatusColor retorna clases correctas', () => {
    expect(component.getStatusColor('Operativo')).toBe('text-emerald-500');
    expect(component.getStatusColor('En Mantenimiento')).toBe('text-amber-500');
    expect(component.getStatusColor('Fuera de Servicio')).toBe('text-red-600');
    expect(component.getStatusColor('En Revisión')).toBe('text-blue-500');
    expect(component.getStatusColor(undefined)).toBe('text-slate-400');
  });

  it('onFilterChange resetea currentPage a 1', () => {
    component.currentPage.set(3);
    component.onFilterChange();
    expect(component.currentPage()).toBe(1);
  });

  it('operationalCount cuenta elevadores operativos', () => {
    component.elevators.set([
      { ascensor_id: 1, estado: 'Operativo' } as any,
      { ascensor_id: 2, estado: 'En Mantenimiento' } as any,
    ]);
    expect(component.operationalCount()).toBe(1);
  });
});
