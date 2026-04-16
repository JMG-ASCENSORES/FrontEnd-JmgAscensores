import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ClientService, Client, Elevator, ApiResponse, ElevatorApiResponse, ClientStatsResponse } from './client.service';
import { environment } from '../../../../environments/environment';

const CLIENTES_URL = `${environment.apiUrl}/clientes`;
const ASCENSORES_URL = `${environment.apiUrl}/ascensores`;

describe('ClientService', () => {
  let service: ClientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClientService],
    });

    service = TestBed.inject(ClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  // ---------------------------------------------------------------------------
  // getClients()
  // ---------------------------------------------------------------------------

  describe('getClients()', () => {
    it('devuelve array de clientes cuando la request es exitosa', () => {
      const mockClients: Client[] = [
        { cliente_id: 1, nombre_comercial: 'Acme SA' },
        { cliente_id: 2, nombre_comercial: 'Globex SRL' },
      ];
      const mockResponse: ApiResponse = {
        success: true,
        message: 'ok',
        data: mockClients,
      };

      let result: Client[] | undefined;
      service.getClients().subscribe(clients => (result = clients));

      const req = httpMock.expectOne(CLIENTES_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(result).toEqual(mockClients);
    });

    it('devuelve array vacío cuando response.data es undefined', () => {
      const mockResponse = { success: true, message: 'ok', data: undefined } as any;

      let result: Client[] | undefined;
      service.getClients().subscribe(clients => (result = clients));

      httpMock.expectOne(CLIENTES_URL).flush(mockResponse);

      expect(result).toEqual([]);
    });

    it('lanza error "No autorizado..." cuando status es 401', () => {
      let caughtError: Error | undefined;
      service.getClients().subscribe({
        error: (err: Error) => (caughtError = err),
      });

      httpMock.expectOne(CLIENTES_URL).flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError?.message).toBe('No autorizado. Por favor inicie sesión nuevamente.');
    });

    it('lanza error genérico cuando el status de error no es 401', () => {
      let caughtError: Error | undefined;
      service.getClients().subscribe({
        error: (err: Error) => (caughtError = err),
      });

      httpMock.expectOne(CLIENTES_URL).flush(
        { message: 'Internal Server Error' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError?.message).toBe('Error al cargar clientes.');
    });
  });

  // ---------------------------------------------------------------------------
  // getClientsPaginated()
  // ---------------------------------------------------------------------------

  describe('getClientsPaginated()', () => {
    it('hace GET con los params de page y limit correctos', () => {
      const mockResponse: ApiResponse = { success: true, message: 'ok', data: [] };

      let result: ApiResponse | undefined;
      service.getClientsPaginated(2, 10).subscribe(res => (result = res));

      const req = httpMock.expectOne(req => req.url === CLIENTES_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('10');
      expect(req.request.params.has('search')).toBe(false);
      req.flush(mockResponse);

      expect(result).toEqual(mockResponse);
    });

    it('agrega el param search cuando se pasa', () => {
      const mockResponse: ApiResponse = { success: true, message: 'ok', data: [] };

      service.getClientsPaginated(1, 5, 'Acme').subscribe();

      const req = httpMock.expectOne(req => req.url === CLIENTES_URL);
      expect(req.request.params.get('search')).toBe('Acme');
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // getClientStats()
  // ---------------------------------------------------------------------------

  describe('getClientStats()', () => {
    it('devuelve las stats cuando la request es exitosa', () => {
      const mockStats: ClientStatsResponse = {
        success: true,
        message: 'ok',
        data: {
          total_clientes: 10,
          total_ascensores: 25,
          total_montacargas: 5,
          total_plataformas: 3,
        },
      };

      let result: ClientStatsResponse | undefined;
      service.getClientStats().subscribe(res => (result = res));

      const req = httpMock.expectOne(`${CLIENTES_URL}/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);

      expect(result).toEqual(mockStats);
    });
  });

  // ---------------------------------------------------------------------------
  // getElevators()
  // ---------------------------------------------------------------------------

  describe('getElevators()', () => {
    it('devuelve array de elevators cuando la request es exitosa', () => {
      const mockElevators: Elevator[] = [
        { ascensor_id: 1, cliente_id: 1, tipo_equipo: 'ascensor', marca: 'Otis', modelo: 'X1', numero_serie: 'SN001', estado: 'activo' },
      ];
      const mockResponse: ElevatorApiResponse = { success: true, message: 'ok', data: mockElevators };

      let result: Elevator[] | undefined;
      service.getElevators().subscribe(elevators => (result = elevators));

      const req = httpMock.expectOne(ASCENSORES_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(result).toEqual(mockElevators);
    });

    it('devuelve array vacío [] cuando la request falla — NO propaga el error', () => {
      let result: Elevator[] | undefined;
      let didError = false;

      service.getElevators().subscribe({
        next: elevators => (result = elevators),
        error: () => (didError = true),
      });

      httpMock.expectOne(ASCENSORES_URL).flush(
        { message: 'Server Error' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      expect(didError).toBe(false);
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // createClient()
  // ---------------------------------------------------------------------------

  describe('createClient()', () => {
    it('hace POST con el body correcto', () => {
      const newClient = { nombre_comercial: 'Nueva Empresa', tipo_cliente: 'corporativo' };
      const mockResponse = { success: true, message: 'creado', data: { cliente_id: 99, ...newClient } };

      let result: any;
      service.createClient(newClient).subscribe(res => (result = res));

      const req = httpMock.expectOne(CLIENTES_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newClient);
      req.flush(mockResponse);

      expect(result).toEqual(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // updateClient()
  // ---------------------------------------------------------------------------

  describe('updateClient()', () => {
    it('hace PUT a la URL correcta con el id y el body', () => {
      const updatedData = { nombre_comercial: 'Empresa Actualizada' };
      const mockResponse = { success: true, message: 'actualizado' };

      let result: any;
      service.updateClient(42, updatedData).subscribe(res => (result = res));

      const req = httpMock.expectOne(`${CLIENTES_URL}/42`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedData);
      req.flush(mockResponse);

      expect(result).toEqual(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteClient()
  // ---------------------------------------------------------------------------

  describe('deleteClient()', () => {
    it('hace DELETE a la URL correcta con el id', () => {
      const mockResponse = { success: true, message: 'eliminado' };

      let result: any;
      service.deleteClient(7).subscribe(res => (result = res));

      const req = httpMock.expectOne(`${CLIENTES_URL}/7`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);

      expect(result).toEqual(mockResponse);
    });
  });
});
