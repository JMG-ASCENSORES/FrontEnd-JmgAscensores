import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import {
  ProgramacionService,
  ProgramacionAPI,
  Programacion,
  CrearProgramacionDTO,
  ActualizarProgramacionDTO,
  ApiResponse,
} from './programacion.service';
import { environment } from '../../../../environments/environment';

const API_URL = `${environment.apiUrl}/programaciones`;

const mockApiProg: ProgramacionAPI = {
  id: 1,
  title: 'Mantenimiento edificio A',
  start: '2026-04-16T08:00:00',
  end: '2026-04-16T10:00:00',
  color: '#3B82F6',
  extendedProps: {
    trabajador_id: 10,
    cliente_id: 5,
    ascensor_id: 3,
    tipo_trabajo: 'mantenimiento',
    estado: 'pendiente',
    descripcion: 'Revisión general',
  },
};

const expectedProgramacion: Programacion = {
  programacion_id: 1,
  titulo: 'Mantenimiento edificio A',
  fecha_inicio: '2026-04-16T08:00:00',
  fecha_fin: '2026-04-16T10:00:00',
  trabajador_id: 10,
  cliente_id: 5,
  ascensor_id: 3,
  tipo_trabajo: 'mantenimiento',
  estado: 'pendiente',
  descripcion: 'Revisión general',
  trabajador: undefined,
  cliente: undefined,
  ascensor: undefined,
};

describe('ProgramacionService', () => {
  let service: ProgramacionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProgramacionService],
    });

    service = TestBed.inject(ProgramacionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  // ---------------------------------------------------------------------------
  // getProgramaciones()
  // ---------------------------------------------------------------------------

  describe('getProgramaciones()', () => {
    it('convierte el formato API al formato interno cuando la request es exitosa', () => {
      let result: Programacion[] | undefined;
      service.getProgramaciones('2026-04-01', '2026-04-30').subscribe(p => (result = p));

      const req = httpMock.expectOne(r => r.url === API_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('start')).toBe('2026-04-01');
      expect(req.request.params.get('end')).toBe('2026-04-30');
      req.flush([mockApiProg]);

      expect(result).toEqual([expectedProgramacion]);
    });

    it('retorna array vacío cuando la respuesta no es un array', () => {
      let result: Programacion[] | undefined;
      service.getProgramaciones('2026-04-01', '2026-04-30').subscribe(p => (result = p));

      httpMock.expectOne(r => r.url === API_URL).flush(null);

      expect(result).toEqual([]);
    });

    it('usa el mes actual cuando no se pasan fechas', () => {
      service.getProgramaciones().subscribe();

      const req = httpMock.expectOne(r => r.url === API_URL);
      expect(req.request.params.has('start')).toBe(true);
      expect(req.request.params.has('end')).toBe(true);
      req.flush([]);
    });

    it('lanza error "No autorizado..." cuando status es 401', () => {
      let caughtError: Error | undefined;
      service.getProgramaciones('2026-04-01', '2026-04-30').subscribe({
        error: (err: Error) => (caughtError = err),
      });

      httpMock.expectOne(r => r.url === API_URL).flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(caughtError?.message).toBe('No autorizado. Por favor inicie sesión nuevamente.');
    });

    it('lanza error de parámetros inválidos cuando status es 400', () => {
      let caughtError: Error | undefined;
      service.getProgramaciones('invalid', 'invalid').subscribe({
        error: (err: Error) => (caughtError = err),
      });

      httpMock.expectOne(r => r.url === API_URL).flush(
        { message: 'Bad Request' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(caughtError?.message).toBe('Parámetros inválidos. Verifique las fechas.');
    });

    it('lanza error genérico para otros errores HTTP', () => {
      let caughtError: Error | undefined;
      service.getProgramaciones('2026-04-01', '2026-04-30').subscribe({
        error: (err: Error) => (caughtError = err),
      });

      httpMock.expectOne(r => r.url === API_URL).flush(
        { message: 'Server Error' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      expect(caughtError?.message).toBe('Error al cargar programaciones.');
    });
  });

  // ---------------------------------------------------------------------------
  // getProgramacionById()
  // ---------------------------------------------------------------------------

  describe('getProgramacionById()', () => {
    it('hace GET a /programaciones/:id y retorna la programación extraída de data', () => {
      const mockResponse: ApiResponse<Programacion> = {
        success: true,
        message: 'ok',
        data: expectedProgramacion,
      };

      let result: Programacion | undefined;
      service.getProgramacionById(1).subscribe(p => (result = p));

      const req = httpMock.expectOne(`${API_URL}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(result).toEqual(expectedProgramacion);
    });

    it('lanza error cuando la request falla', () => {
      let caughtError: Error | undefined;
      service.getProgramacionById(99).subscribe({
        error: (err: Error) => (caughtError = err),
      });

      httpMock.expectOne(`${API_URL}/99`).flush(
        { message: 'Not Found' },
        { status: 404, statusText: 'Not Found' }
      );

      expect(caughtError?.message).toBe('Error al cargar la programación.');
    });
  });

  // ---------------------------------------------------------------------------
  // createProgramacion()
  // ---------------------------------------------------------------------------

  describe('createProgramacion()', () => {
    it('hace POST con el body correcto y retorna la programación creada', () => {
      const dto: CrearProgramacionDTO = {
        titulo: 'Nueva tarea',
        start: '2026-04-20T09:00:00',
        end: '2026-04-20T11:00:00',
        trabajador_id: 10,
        tipo_trabajo: 'reparacion',
      };
      const mockResponse: ApiResponse<Programacion> = {
        success: true,
        message: 'creada',
        data: { ...expectedProgramacion, titulo: 'Nueva tarea' },
      };

      let result: Programacion | undefined;
      service.createProgramacion(dto).subscribe(p => (result = p));

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);

      expect(result?.titulo).toBe('Nueva tarea');
    });

    it('lanza error con el mensaje del backend cuando falla', () => {
      let caughtError: Error | undefined;
      service.createProgramacion({ titulo: 'x', start: '', end: '', trabajador_id: 1, tipo_trabajo: 'emergencia' }).subscribe({
        error: (err: Error) => (caughtError = err),
      });

      httpMock.expectOne(API_URL).flush(
        { message: 'Trabajador no disponible' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(caughtError?.message).toBe('Trabajador no disponible');
    });
  });

  // ---------------------------------------------------------------------------
  // updateProgramacion()
  // ---------------------------------------------------------------------------

  describe('updateProgramacion()', () => {
    it('hace PUT a /programaciones/:id con el body correcto', () => {
      const dto: ActualizarProgramacionDTO = { titulo: 'Título actualizado', estado: 'en_progreso' };
      const mockResponse: ApiResponse<Programacion> = {
        success: true,
        message: 'actualizada',
        data: { ...expectedProgramacion, titulo: 'Título actualizado' },
      };

      let result: Programacion | undefined;
      service.updateProgramacion(1, dto).subscribe(p => (result = p));

      const req = httpMock.expectOne(`${API_URL}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);

      expect(result?.titulo).toBe('Título actualizado');
    });
  });

  // ---------------------------------------------------------------------------
  // patchEstado()
  // ---------------------------------------------------------------------------

  describe('patchEstado()', () => {
    it('hace PATCH a /programaciones/:id/estado con el estado correcto', () => {
      const mockResponse: ApiResponse<Programacion> = {
        success: true,
        message: 'estado actualizado',
        data: { ...expectedProgramacion, estado: 'completada' },
      };

      let result: Programacion | undefined;
      service.patchEstado(1, 'completada').subscribe(p => (result = p));

      const req = httpMock.expectOne(`${API_URL}/1/estado`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ estado: 'completada' });
      req.flush(mockResponse);

      expect(result?.estado).toBe('completada');
    });
  });

  // ---------------------------------------------------------------------------
  // deleteProgramacion()
  // ---------------------------------------------------------------------------

  describe('deleteProgramacion()', () => {
    it('hace DELETE a /programaciones/:id', () => {
      let completed = false;
      service.deleteProgramacion(1).subscribe(() => (completed = true));

      const req = httpMock.expectOne(`${API_URL}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      expect(completed).toBe(true);
    });

    it('lanza error cuando la request falla', () => {
      let caughtError: Error | undefined;
      service.deleteProgramacion(99).subscribe({
        error: (err: Error) => (caughtError = err),
      });

      httpMock.expectOne(`${API_URL}/99`).flush(
        { message: 'Not Found' },
        { status: 404, statusText: 'Not Found' }
      );

      expect(caughtError?.message).toBe('Error al eliminar la programación.');
    });
  });

  // ---------------------------------------------------------------------------
  // Helper methods
  // ---------------------------------------------------------------------------

  describe('combinarFechaHora()', () => {
    it('combina fecha y hora en formato ISO', () => {
      expect(service.combinarFechaHora('2026-04-16', '09:00')).toBe('2026-04-16T09:00:00');
    });
  });

  describe('getTipoTrabajoLabel()', () => {
    it('retorna el label correcto para cada tipo', () => {
      expect(service.getTipoTrabajoLabel('mantenimiento')).toBe('Mantenimiento');
      expect(service.getTipoTrabajoLabel('reparacion')).toBe('Reparación');
      expect(service.getTipoTrabajoLabel('inspeccion')).toBe('Inspección');
      expect(service.getTipoTrabajoLabel('emergencia')).toBe('Emergencia');
    });
  });

  describe('getTipoTrabajoColor()', () => {
    it('retorna clases de color correctas para cada tipo', () => {
      expect(service.getTipoTrabajoColor('mantenimiento')).toBe('bg-blue-100 text-blue-700');
      expect(service.getTipoTrabajoColor('emergencia')).toBe('bg-red-100 text-red-700');
    });
  });

  describe('getEstadoColor()', () => {
    it('retorna clases de color correctas para cada estado', () => {
      expect(service.getEstadoColor('pendiente')).toBe('bg-yellow-100 text-yellow-700');
      expect(service.getEstadoColor('completada')).toBe('bg-green-100 text-green-700');
      expect(service.getEstadoColor('cancelada')).toBe('bg-red-100 text-red-700');
      expect(service.getEstadoColor('en_progreso')).toBe('bg-blue-100 text-blue-700');
    });
  });
});
