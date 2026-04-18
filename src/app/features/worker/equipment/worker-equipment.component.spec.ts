import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { WorkerEquipmentComponent } from './worker-equipment.component';
import { WorkerEquipmentService } from './worker-equipment.service';

const mockClientesResponse = {
  data: [
    { cliente_id: 1, nombre_comercial: 'Cliente A', equipos_count: 3 },
    { cliente_id: 2, nombre_comercial: 'Cliente B', equipos_count: 2 }
  ],
  meta: { totalItems: 2, totalPages: 1 }
};

const mockEquipos = [
  { ascensor_id: 1, tipo: 'Ascensor', estado: 'Operativo', cliente_id: 1 },
  { ascensor_id: 2, tipo: 'Montacargas', estado: 'Inoperativo', cliente_id: 1 }
];

describe('WorkerEquipmentComponent', () => {
  let component: WorkerEquipmentComponent;
  let fixture: ComponentFixture<WorkerEquipmentComponent>;
  let workerEquipmentServiceMock: any;

  beforeEach(async () => {
    workerEquipmentServiceMock = {
      getClientesPaginated: vi.fn().mockReturnValue(of(mockClientesResponse)),
      getEquiposByCliente: vi.fn().mockReturnValue(of(mockEquipos))
    };

    await TestBed.configureTestingModule({
      imports: [WorkerEquipmentComponent],
      providers: [
        { provide: WorkerEquipmentService, useValue: workerEquipmentServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerEquipmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('nextPage()', () => {
    it('should increment currentPage if less than totalPages', () => {
      component.currentPage.set(1);
      component.totalPages.set(3);
      component.nextPage();
      expect(component.currentPage()).toBe(2);
    });

    it('should not increment currentPage if at totalPages', () => {
      component.currentPage.set(3);
      component.totalPages.set(3);
      workerEquipmentServiceMock.getClientesPaginated.mockClear();
      component.nextPage();
      expect(component.currentPage()).toBe(3);
      expect(workerEquipmentServiceMock.getClientesPaginated).not.toHaveBeenCalled();
    });

    it('should call loadClientes after incrementing page', () => {
      component.currentPage.set(1);
      component.totalPages.set(3);
      workerEquipmentServiceMock.getClientesPaginated.mockClear();
      component.nextPage();
      expect(workerEquipmentServiceMock.getClientesPaginated).toHaveBeenCalled();
    });
  });

  describe('prevPage()', () => {
    it('should decrement currentPage if greater than 1', () => {
      component.currentPage.set(3);
      component.prevPage();
      expect(component.currentPage()).toBe(2);
    });

    it('should not decrement currentPage if at page 1', () => {
      component.currentPage.set(1);
      workerEquipmentServiceMock.getClientesPaginated.mockClear();
      component.prevPage();
      expect(component.currentPage()).toBe(1);
      expect(workerEquipmentServiceMock.getClientesPaginated).not.toHaveBeenCalled();
    });

    it('should call loadClientes after decrementing page', () => {
      component.currentPage.set(2);
      workerEquipmentServiceMock.getClientesPaginated.mockClear();
      component.prevPage();
      expect(workerEquipmentServiceMock.getClientesPaginated).toHaveBeenCalled();
    });
  });

  describe('clearSearch()', () => {
    it('should reset searchQuery to empty string', () => {
      component.searchQuery.set('test query');
      component.clearSearch();
      expect(component.searchQuery()).toBe('');
    });

    it('should reset currentPage to 1', () => {
      component.currentPage.set(5);
      component.clearSearch();
      expect(component.currentPage()).toBe(1);
    });

    it('should call loadClientes', () => {
      workerEquipmentServiceMock.getClientesPaginated.mockClear();
      component.clearSearch();
      expect(workerEquipmentServiceMock.getClientesPaginated).toHaveBeenCalled();
    });
  });

  describe('selectCliente()', () => {
    it('should set selectedCliente with the provided cliente', () => {
      const cliente = mockClientesResponse.data[0];
      component.selectCliente(cliente as any);
      expect(component.selectedCliente()).toBe(cliente);
    });

    it('should call getEquiposByCliente with cliente_id', () => {
      const cliente = mockClientesResponse.data[0];
      component.selectCliente(cliente as any);
      expect(workerEquipmentServiceMock.getEquiposByCliente).toHaveBeenCalledWith(cliente.cliente_id);
    });

    it('should set equiposCliente from service response', () => {
      const cliente = mockClientesResponse.data[0];
      component.selectCliente(cliente as any);
      expect(component.equiposCliente()).toHaveLength(2);
    });

    it('should set selectedEquipo to null when selecting a new client', () => {
      component.selectedEquipo.set(mockEquipos[0] as any);
      component.selectCliente(mockClientesResponse.data[0] as any);
      expect(component.selectedEquipo()).toBeNull();
    });
  });

  describe('closeClientModal()', () => {
    it('should clear selectedCliente', () => {
      component.selectedCliente.set(mockClientesResponse.data[0] as any);
      component.closeClientModal();
      expect(component.selectedCliente()).toBeNull();
    });

    it('should clear equiposCliente', () => {
      component.equiposCliente.set(mockEquipos as any);
      component.closeClientModal();
      expect(component.equiposCliente()).toHaveLength(0);
    });

    it('should clear selectedEquipo', () => {
      component.selectedEquipo.set(mockEquipos[0] as any);
      component.closeClientModal();
      expect(component.selectedEquipo()).toBeNull();
    });
  });

  describe('getEstadoIconClasses()', () => {
    it('should return emerald classes for activo estado', () => {
      expect(component.getEstadoIconClasses('activo')).toBe('bg-emerald-100 text-emerald-600');
    });

    it('should return emerald classes for operativo estado', () => {
      expect(component.getEstadoIconClasses('Operativo')).toBe('bg-emerald-100 text-emerald-600');
    });

    it('should return red classes for inoperativo estado', () => {
      expect(component.getEstadoIconClasses('Inoperativo')).toBe('bg-red-100 text-red-500');
    });

    it('should return amber classes for reparacion estado', () => {
      expect(component.getEstadoIconClasses('reparacion')).toBe('bg-amber-100 text-amber-600');
    });

    it('should return amber classes for mantenimiento estado', () => {
      expect(component.getEstadoIconClasses('mantenimiento')).toBe('bg-amber-100 text-amber-600');
    });

    it('should return slate classes for unknown estado', () => {
      expect(component.getEstadoIconClasses('desconocido')).toBe('bg-slate-100 text-slate-500');
    });
  });

  describe('getTipoIcon()', () => {
    it("should return 'bi-elevator' for unknown tipo", () => {
      expect(component.getTipoIcon('ascensor')).toBe('bi-elevator');
    });

    it("should return 'bi-elevator' for empty tipo", () => {
      expect(component.getTipoIcon('')).toBe('bi-elevator');
    });

    it("should return 'bi-box-seam' for montacargas", () => {
      expect(component.getTipoIcon('montacargas')).toBe('bi-box-seam');
    });

    it("should return 'bi-arrow-up-square' for plataforma", () => {
      expect(component.getTipoIcon('plataforma')).toBe('bi-arrow-up-square');
    });

    it("should return 'bi-chevron-bar-up' for escalera", () => {
      expect(component.getTipoIcon('escalera mecanica')).toBe('bi-chevron-bar-up');
    });
  });
});
