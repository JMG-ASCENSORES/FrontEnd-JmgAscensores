import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { WorkerEquipmentService, ClienteResumen, EquipoCliente } from './worker-equipment.service';
import { environment } from '../../../../environments/environment';

const CLIENTES_URL = `${environment.apiUrl}/clientes`;

const mockCliente: ClienteResumen = {
  cliente_id: 1,
  codigo: 'CLI001',
  nombre_comercial: 'Edificio Central',
  contacto_nombre: 'Juan',
  contacto_apellido: 'Pérez',
  contacto_telefono: '999000111',
  ubicacion: 'Av. Principal 123',
  ciudad: 'Lima',
  distrito: 'Miraflores',
  tipo_cliente: 'corporativo',
};

const mockEquipo: EquipoCliente = {
  ascensor_id: 10,
  cliente_id: 1,
  tipo_equipo: 'ascensor',
  marca: 'Otis',
  modelo: 'Gen2',
  numero_serie: 'SN123456',
  capacidad_kg: 630,
  capacidad_personas: 8,
  piso_cantidad: 10,
  fecha_ultimo_mantenimiento: '2026-03-01',
  estado: 'activo',
  observaciones: 'Sin novedades',
};

describe('WorkerEquipmentService', () => {
  let service: WorkerEquipmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WorkerEquipmentService],
    });

    service = TestBed.inject(WorkerEquipmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  // ---------------------------------------------------------------------------
  // getClientes()
  // ---------------------------------------------------------------------------

  describe('getClientes()', () => {
    it('hace GET a /clientes y retorna la lista de clientes extraída de data', () => {
      const mockResponse = { success: true, message: 'ok', data: [mockCliente] };

      let result: ClienteResumen[] | undefined;
      service.getClientes().subscribe(c => (result = c));

      const req = httpMock.expectOne(CLIENTES_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(result).toEqual([mockCliente]);
    });

    it('retorna array vacío cuando data es undefined', () => {
      const mockResponse = { success: true, message: 'ok', data: undefined };

      let result: ClienteResumen[] | undefined;
      service.getClientes().subscribe(c => (result = c));

      httpMock.expectOne(CLIENTES_URL).flush(mockResponse);

      expect(result).toEqual([]);
    });

    it('lanza error cuando la request falla', () => {
      let caughtError: Error | undefined;
      service.getClientes().subscribe({
        error: (err: Error) => (caughtError = err),
      });

      httpMock.expectOne(CLIENTES_URL).flush(
        { message: 'Server Error' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError?.message).toBe('Error al cargar la lista de clientes.');
    });
  });

  // ---------------------------------------------------------------------------
  // getClientesPaginated()
  // ---------------------------------------------------------------------------

  describe('getClientesPaginated()', () => {
    it('hace GET con los params page y limit correctos', () => {
      const mockResponse = { success: true, message: 'ok', data: [mockCliente], meta: { totalItems: 1, itemsPerPage: 10, currentPage: 1, totalPages: 1 } };

      let result: any;
      service.getClientesPaginated(1, 10).subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === CLIENTES_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('10');
      expect(req.request.params.has('search')).toBe(false);
      req.flush(mockResponse);

      expect(result).toEqual(mockResponse);
    });

    it('agrega el param search cuando se pasa', () => {
      const mockResponse = { success: true, message: 'ok', data: [] };

      service.getClientesPaginated(1, 5, 'Edificio').subscribe();

      const req = httpMock.expectOne(r => r.url === CLIENTES_URL);
      expect(req.request.params.get('search')).toBe('Edificio');
      req.flush(mockResponse);
    });

    it('lanza error cuando la request falla', () => {
      let caughtError: Error | undefined;
      service.getClientesPaginated(1, 10).subscribe({
        error: (err: Error) => (caughtError = err),
      });

      httpMock.expectOne(r => r.url === CLIENTES_URL).flush(
        { message: 'Server Error' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      expect(caughtError?.message).toBe('Error al cargar clientes.');
    });
  });

  // ---------------------------------------------------------------------------
  // getEquiposByCliente()
  // ---------------------------------------------------------------------------

  describe('getEquiposByCliente()', () => {
    it('hace GET a /clientes/:id/ascensores y retorna los equipos', () => {
      const mockResponse = { success: true, message: 'ok', data: [mockEquipo] };

      let result: EquipoCliente[] | undefined;
      service.getEquiposByCliente(1).subscribe(e => (result = e));

      const req = httpMock.expectOne(`${CLIENTES_URL}/1/ascensores`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(result).toEqual([mockEquipo]);
    });

    it('retorna array vacío cuando data es undefined', () => {
      const mockResponse = { success: true, message: 'ok', data: undefined };

      let result: EquipoCliente[] | undefined;
      service.getEquiposByCliente(1).subscribe(e => (result = e));

      httpMock.expectOne(`${CLIENTES_URL}/1/ascensores`).flush(mockResponse);

      expect(result).toEqual([]);
    });

    it('retorna array vacío [] cuando la request falla — NO propaga el error', () => {
      let result: EquipoCliente[] | undefined;
      let didError = false;

      service.getEquiposByCliente(99).subscribe({
        next: e => (result = e),
        error: () => (didError = true),
      });

      httpMock.expectOne(`${CLIENTES_URL}/99/ascensores`).flush(
        { message: 'Not Found' },
        { status: 404, statusText: 'Not Found' }
      );

      expect(didError).toBe(false);
      expect(result).toEqual([]);
    });
  });
});
