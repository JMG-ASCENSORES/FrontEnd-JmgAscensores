import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ElevatorService, ElevatorApiResponse } from './elevator.service';
import { Elevator } from '../../../core/models/elevator.model';
import { environment } from '../../../../environments/environment';

const BASE_URL = `${environment.apiUrl}/ascensores`;

const mockElevator: Elevator = {
  ascensor_id: 1,
  cliente_id: 10,
  tipo_equipo: 'Hidráulico',
  marca: 'Otis',
  modelo: 'Gen2',
  numero_serie: 'SN-001',
  estado: 'activo',
};

const mockElevator2: Elevator = {
  ascensor_id: 2,
  cliente_id: 20,
  tipo_equipo: 'Eléctrico',
  marca: 'Schindler',
  modelo: '3300',
  numero_serie: 'SN-002',
  estado: 'inactivo',
};

describe('ElevatorService', () => {
  let service: ElevatorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ElevatorService],
    });

    service = TestBed.inject(ElevatorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  // ─── getElevators ──────────────────────────────────────────────────────────

  describe('getElevators()', () => {
    it('sin parámetros: realiza GET a /ascensores sin query string', () => {
      service.getElevators().subscribe();

      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: '', data: [] });
    });

    it('con clientId: la URL incluye cliente_id=X', () => {
      service.getElevators(10).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}?cliente_id=10`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: '', data: [] });
    });

    it('con tipoEquipo: la URL incluye tipo_equipo=X', () => {
      service.getElevators(undefined, 'Hidráulico').subscribe();

      // El servicio construye la URL con string interpolation (sin encodeURIComponent)
      // por lo que la URL llega sin encoding al HttpClient
      const req = httpMock.expectOne(`${BASE_URL}?tipo_equipo=Hidráulico`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: '', data: [] });
    });

    it('con clientId y tipoEquipo: la URL incluye ambos parámetros', () => {
      service.getElevators(10, 'Eléctrico').subscribe();

      const req = httpMock.expectOne(`${BASE_URL}?cliente_id=10&tipo_equipo=Eléctrico`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: '', data: [] });
    });

    it('response con array: devuelve el array directamente', () => {
      let result: Elevator[] | undefined;
      service.getElevators().subscribe(data => (result = data));

      const req = httpMock.expectOne(BASE_URL);
      req.flush({ success: true, message: '', data: [mockElevator, mockElevator2] });

      expect(result).toEqual([mockElevator, mockElevator2]);
    });

    it('response con objeto único: lo envuelve en array', () => {
      let result: Elevator[] | undefined;
      service.getElevators().subscribe(data => (result = data));

      const req = httpMock.expectOne(BASE_URL);
      req.flush({ success: true, message: '', data: mockElevator });

      expect(result).toEqual([mockElevator]);
    });

    it('error 401: lanza "No autorizado."', () => {
      let errorMsg: string | undefined;
      service.getElevators().subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(BASE_URL);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(errorMsg).toBe('No autorizado.');
    });

    it('error genérico: lanza "Error al cargar equipos."', () => {
      let errorMsg: string | undefined;
      service.getElevators().subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(BASE_URL);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorMsg).toBe('Error al cargar equipos.');
    });
  });

  // ─── getElevatorsPaginated ─────────────────────────────────────────────────

  describe('getElevatorsPaginated()', () => {
    it('realiza GET con page y limit correctos', () => {
      let result: ElevatorApiResponse | undefined;
      service.getElevatorsPaginated(1, 10).subscribe(data => (result = data));

      const req = httpMock.expectOne(r => r.url === BASE_URL);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('10');

      const mockResponse: ElevatorApiResponse = {
        success: true,
        message: '',
        data: [mockElevator],
        meta: { totalItems: 1, itemsPerPage: 10, currentPage: 1, totalPages: 1 },
      };
      req.flush(mockResponse);

      expect(result).toEqual(mockResponse);
    });

    it('incluye parámetros opcionales cuando se proveen', () => {
      service.getElevatorsPaginated(2, 5, 'Otis', 10, 'Hidráulico', 'activo').subscribe();

      const req = httpMock.expectOne(r => r.url === BASE_URL);
      expect(req.request.params.get('search')).toBe('Otis');
      expect(req.request.params.get('cliente_id')).toBe('10');
      expect(req.request.params.get('tipo_equipo')).toBe('Hidráulico');
      expect(req.request.params.get('estado')).toBe('activo');
      req.flush({ success: true, message: '', data: [] });
    });

    it('error 401: lanza "No autorizado."', () => {
      let errorMsg: string | undefined;
      service.getElevatorsPaginated(1, 10).subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(r => r.url === BASE_URL);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(errorMsg).toBe('No autorizado.');
    });
  });

  // ─── getElevatorById ───────────────────────────────────────────────────────

  describe('getElevatorById()', () => {
    it('devuelve el elevator del response', () => {
      let result: Elevator | undefined;
      service.getElevatorById(1).subscribe(data => (result = data));

      const req = httpMock.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: '', data: mockElevator });

      expect(result).toEqual(mockElevator);
    });

    it('error 404: lanza "Equipo no encontrado."', () => {
      let errorMsg: string | undefined;
      service.getElevatorById(99).subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(`${BASE_URL}/99`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorMsg).toBe('Equipo no encontrado.');
    });

    it('error genérico: lanza "Error al cargar equipo."', () => {
      let errorMsg: string | undefined;
      service.getElevatorById(1).subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(`${BASE_URL}/1`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorMsg).toBe('Error al cargar equipo.');
    });
  });

  // ─── createElevator ────────────────────────────────────────────────────────

  describe('createElevator()', () => {
    const newElevator: Partial<Elevator> = {
      cliente_id: 10,
      tipo_equipo: 'Hidráulico',
      marca: 'Otis',
      modelo: 'Gen2',
      numero_serie: 'SN-003',
      estado: 'activo',
    };

    it('POST con body correcto y devuelve el elevator creado', () => {
      let result: Elevator | undefined;
      service.createElevator(newElevator).subscribe(data => (result = data));

      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newElevator);
      req.flush({ success: true, message: '', data: { ...newElevator, ascensor_id: 3 } });

      expect(result).toEqual({ ...newElevator, ascensor_id: 3 });
    });

    it('error 400 con mensaje del servidor: lanza ese mensaje', () => {
      let errorMsg: string | undefined;
      service.createElevator(newElevator).subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(BASE_URL);
      req.flush(
        { message: 'El número de serie ya existe.' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorMsg).toBe('El número de serie ya existe.');
    });

    it('error 400 sin mensaje del servidor: lanza "Datos inválidos."', () => {
      let errorMsg: string | undefined;
      service.createElevator(newElevator).subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(BASE_URL);
      req.flush({}, { status: 400, statusText: 'Bad Request' });

      expect(errorMsg).toBe('Datos inválidos.');
    });

    it('error 404: lanza "Cliente no encontrado."', () => {
      let errorMsg: string | undefined;
      service.createElevator(newElevator).subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(BASE_URL);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorMsg).toBe('Cliente no encontrado.');
    });

    it('error genérico: lanza "Error al crear equipo."', () => {
      let errorMsg: string | undefined;
      service.createElevator(newElevator).subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(BASE_URL);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorMsg).toBe('Error al crear equipo.');
    });
  });

  // ─── updateElevator ────────────────────────────────────────────────────────

  describe('updateElevator()', () => {
    const changes: Partial<Elevator> = { estado: 'inactivo' };

    it('PUT a la URL correcta y devuelve el elevator actualizado', () => {
      let result: Elevator | undefined;
      service.updateElevator(1, changes).subscribe(data => (result = data));

      const req = httpMock.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(changes);
      req.flush({ success: true, message: '', data: { ...mockElevator, estado: 'inactivo' } });

      expect(result).toEqual({ ...mockElevator, estado: 'inactivo' });
    });

    it('error 404: lanza "Equipo no encontrado."', () => {
      let errorMsg: string | undefined;
      service.updateElevator(99, changes).subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(`${BASE_URL}/99`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorMsg).toBe('Equipo no encontrado.');
    });

    it('error 400 con mensaje del servidor: lanza ese mensaje', () => {
      let errorMsg: string | undefined;
      service.updateElevator(1, changes).subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(`${BASE_URL}/1`);
      req.flush(
        { message: 'Estado inválido.' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorMsg).toBe('Estado inválido.');
    });

    it('error genérico: lanza "Error al actualizar equipo."', () => {
      let errorMsg: string | undefined;
      service.updateElevator(1, changes).subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(`${BASE_URL}/1`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorMsg).toBe('Error al actualizar equipo.');
    });
  });

  // ─── deleteElevator ────────────────────────────────────────────────────────

  describe('deleteElevator()', () => {
    it('DELETE a la URL correcta y completa sin error', () => {
      let completed = false;
      service.deleteElevator(1).subscribe({ complete: () => (completed = true) });

      const req = httpMock.expectOne(`${BASE_URL}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: '', data: [] });

      expect(completed).toBe(true);
    });

    it('error 404: lanza "Equipo no encontrado."', () => {
      let errorMsg: string | undefined;
      service.deleteElevator(99).subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(`${BASE_URL}/99`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorMsg).toBe('Equipo no encontrado.');
    });

    it('error genérico: lanza "Error al eliminar equipo."', () => {
      let errorMsg: string | undefined;
      service.deleteElevator(1).subscribe({
        error: (err: Error) => (errorMsg = err.message),
      });

      const req = httpMock.expectOne(`${BASE_URL}/1`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorMsg).toBe('Error al eliminar equipo.');
    });
  });

  // ─── Authorization header ──────────────────────────────────────────────────
  // El header Authorization es inyectado por el authInterceptor, no por el servicio.
  // Los tests de integración del interceptor cubren este comportamiento.
});
