import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { MantenimientoFijoService } from './mantenimiento-fijo.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = `${environment.apiUrl}/mantenimientos-fijos`;

describe('MantenimientoFijoService', () => {
  let service: MantenimientoFijoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('token', 'fake-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MantenimientoFijoService],
    });

    service = TestBed.inject(MantenimientoFijoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  // ─── listar() ────────────────────────────────────────────────────────────────

  describe('listar()', () => {
    it('sin param → GET sin query params', () => {
      service.listar().subscribe();
      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys()).toHaveLength(0);
      req.flush([]);
    });

    it('con ascensor_id → incluye param en la URL', () => {
      service.listar(3).subscribe();
      const req = httpMock.expectOne(r => r.url === BASE_URL);
      expect(req.request.params.get('ascensor_id')).toBe('3');
      req.flush([]);
    });
  });

  // ─── crear() ─────────────────────────────────────────────────────────────────

  describe('crear()', () => {
    it('POST con body correcto', () => {
      const dto = {
        ascensor_id: 10,
        trabajador_id: 2,
        dia_mes: 15,
        hora: '09:00',
        frecuencia: 'mensual' as const,
      };
      service.crear(dto).subscribe();
      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
    });

    it('error con message → lanza ese mensaje', () => {
      let errorMsg = '';
      service.crear({ ascensor_id: 1, dia_mes: 1, hora: '08:00', frecuencia: 'mensual' }).subscribe({
        error: (e: Error) => (errorMsg = e.message),
      });
      httpMock.expectOne(BASE_URL).flush(
        { message: 'Ascensor no existe' },
        { status: 400, statusText: 'Bad Request' }
      );
      expect(errorMsg).toBe('Ascensor no existe');
    });

    it('error sin message → lanza mensaje por defecto', () => {
      let errorMsg = '';
      service.crear({ ascensor_id: 1, dia_mes: 1, hora: '08:00', frecuencia: 'mensual' }).subscribe({
        error: (e: Error) => (errorMsg = e.message),
      });
      httpMock.expectOne(BASE_URL).flush({}, { status: 500, statusText: 'Internal Server Error' });
      expect(errorMsg).toBe('Error al crear el mantenimiento fijo.');
    });
  });

  // ─── actualizar() ────────────────────────────────────────────────────────────

  describe('actualizar()', () => {
    it('PUT a la URL correcta con body', () => {
      const update = { hora: '10:00' };
      service.actualizar(5, update).subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/5`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(update);
      req.flush({ success: true });
    });

    it('error → lanza mensaje apropiado', () => {
      let errorMsg = '';
      service.actualizar(5, { hora: '10:00' }).subscribe({
        error: (e: Error) => (errorMsg = e.message),
      });
      httpMock.expectOne(`${BASE_URL}/5`).flush(
        { message: 'Registro no encontrado' },
        { status: 404, statusText: 'Not Found' }
      );
      expect(errorMsg).toBe('Registro no encontrado');
    });
  });

  // ─── eliminar() ──────────────────────────────────────────────────────────────

  describe('eliminar()', () => {
    it('DELETE a la URL correcta', () => {
      service.eliminar(8).subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/8`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('error → lanza mensaje apropiado', () => {
      let errorMsg = '';
      service.eliminar(8).subscribe({
        error: (e: Error) => (errorMsg = e.message),
      });
      httpMock.expectOne(`${BASE_URL}/8`).flush(
        { message: 'No se puede eliminar' },
        { status: 409, statusText: 'Conflict' }
      );
      expect(errorMsg).toBe('No se puede eliminar');
    });
  });
});
