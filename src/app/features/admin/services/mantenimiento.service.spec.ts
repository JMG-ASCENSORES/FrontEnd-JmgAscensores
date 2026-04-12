import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { MantenimientoService } from './mantenimiento.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = `${environment.apiUrl}/programaciones`;

describe('MantenimientoService', () => {
  let service: MantenimientoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('token', 'fake-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MantenimientoService],
    });

    service = TestBed.inject(MantenimientoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  // ─── listar() ────────────────────────────────────────────────────────────────

  describe('listar()', () => {
    it('sin params → GET a /programaciones sin query params', () => {
      service.listar().subscribe();
      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys()).toHaveLength(0);
      req.flush([]);
    });

    it('con start y end → incluye esos params', () => {
      service.listar('2025-01-01', '2025-01-31').subscribe();
      const req = httpMock.expectOne(r => r.url === BASE_URL);
      expect(req.request.params.get('start')).toBe('2025-01-01');
      expect(req.request.params.get('end')).toBe('2025-01-31');
      req.flush([]);
    });

    it('con trabajadorId → incluye param trabajador_id', () => {
      service.listar(undefined, undefined, 5).subscribe();
      const req = httpMock.expectOne(r => r.url === BASE_URL);
      expect(req.request.params.get('trabajador_id')).toBe('5');
      req.flush([]);
    });

    it('con detailed=true → incluye param detailed=true', () => {
      service.listar(undefined, undefined, undefined, true).subscribe();
      const req = httpMock.expectOne(r => r.url === BASE_URL);
      expect(req.request.params.get('detailed')).toBe('true');
      req.flush([]);
    });

    it('response como array directo → mapea correctamente', () => {
      const raw = [
        { id: 1, title: 'Test', start: '2025-01-01T08:00:00', end: '2025-01-01T09:00:00', color: '#fff', extendedProps: {} }
      ];
      let result: any[] = [];
      service.listar().subscribe(r => (result = r));
      httpMock.expectOne(BASE_URL).flush(raw);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].title).toBe('Test');
    });

    it('response como { data: [] } → mapea correctamente', () => {
      const raw = {
        success: true,
        data: [
          { id: 2, title: 'Obj', start: '2025-02-01T08:00:00', end: '2025-02-01T09:00:00', color: '#000', extendedProps: {} }
        ]
      };
      let result: any[] = [];
      service.listar().subscribe(r => (result = r));
      httpMock.expectOne(BASE_URL).flush(raw);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('error HTTP → retorna [] (NO propaga)', () => {
      let result: any[] | undefined;
      let errored = false;
      service.listar().subscribe({
        next: r => (result = r),
        error: () => (errored = true),
      });
      httpMock.expectOne(BASE_URL).flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
      expect(errored).toBe(false);
      expect(result).toEqual([]);
    });
  });

  // ─── mapToMantenimiento — rama "ya formateado" (FullCalendar) ─────────────────

  describe('mapToMantenimiento — rama FullCalendar', () => {
    it('si response tiene id+title+start → retorna sin transformar', () => {
      const fc = {
        id: 99,
        title: 'Ya formateado',
        start: '2025-03-15T10:00:00',
        end: '2025-03-15T11:00:00',
        color: '#abc',
        extendedProps: { cliente_id: 7 },
      };
      let result: any[] = [];
      service.listar().subscribe(r => (result = r));
      httpMock.expectOne(BASE_URL).flush([fc]);
      expect(result[0]).toEqual(fc);
    });
  });

  // ─── mapToMantenimiento — rama "raw" ─────────────────────────────────────────

  describe('mapToMantenimiento — rama raw', () => {
    it('mapea mantenimiento_id → id', () => {
      const raw = {
        mantenimiento_id: 42,
        titulo: 'Raw item',
        fecha_programada: '2025-04-10',
        hora_estimada_inicio: '09:00:00',
        hora_estimada_fin: '10:00:00',
      };
      let result: any[] = [];
      service.listar().subscribe(r => (result = r));
      httpMock.expectOne(BASE_URL).flush([raw]);
      expect(result[0].id).toBe(42);
      expect(result[0].title).toBe('Raw item');
    });

    it('construye start/end combinando fecha_programada + hora_estimada_inicio/fin', () => {
      const raw = {
        mantenimiento_id: 10,
        titulo: 'Fechas',
        fecha_programada: '2025-05-20',
        hora_estimada_inicio: '14:30:00',
        hora_estimada_fin: '15:45:00',
      };
      let result: any[] = [];
      service.listar().subscribe(r => (result = r));
      httpMock.expectOne(BASE_URL).flush([raw]);
      expect(result[0].start).toBe('2025-05-20T14:30:00');
      expect(result[0].end).toBe('2025-05-20T15:45:00');
    });
  });

  // ─── getById() ───────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('retorna Mantenimiento mapeado cuando hay response.data', () => {
      const data = {
        id: 5,
        title: 'Por ID',
        start: '2025-06-01T08:00:00',
        end: '2025-06-01T09:00:00',
        color: '#333',
        extendedProps: {},
      };
      let result: any;
      service.getById(5).subscribe(r => (result = r));
      httpMock.expectOne(`${BASE_URL}/5`).flush({ success: true, data });
      expect(result).toEqual(data);
    });

    it('error → retorna null (NO propaga)', () => {
      let result: any = 'initial';
      let errored = false;
      service.getById(999).subscribe({
        next: r => (result = r),
        error: () => (errored = true),
      });
      httpMock.expectOne(`${BASE_URL}/999`).flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
      expect(errored).toBe(false);
      expect(result).toBeNull();
    });
  });

  // ─── crear() ─────────────────────────────────────────────────────────────────

  describe('crear()', () => {
    it('POST con payload correcto (start/end construidos desde fecha+horas)', () => {
      const dto = {
        titulo: 'Nuevo mant',
        fecha_programada: '2025-07-15',
        hora_estimada_inicio: '09:00',
        hora_estimada_fin: '10:00',
        tipo_trabajo: 'correctivo',
        color: '#ff0000',
        trabajador_ids: [3],
        cliente_id: 1,
        ascensor_id: 2,
      };
      service.crear(dto).subscribe();
      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.start).toBe('2025-07-15T09:00:00');
      expect(req.request.body.end).toBe('2025-07-15T10:00:00');
      expect(req.request.body.titulo).toBe('Nuevo mant');
      req.flush({ success: true });
    });

    it('trabajador_ids=[1,0,2] en input → [1,2] en payload (filtra ceros)', () => {
      const dto = {
        titulo: 'Filtrar ceros',
        trabajador_ids: [1, 0, 2],
      };
      service.crear(dto).subscribe();
      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.body.trabajador_ids).toEqual([1, 2]);
      req.flush({ success: true });
    });

    it('cliente_id=0 → null en payload', () => {
      const dto = {
        titulo: 'Sin cliente',
        cliente_id: 0,
        ascensor_id: 0,
      };
      service.crear(dto).subscribe();
      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.body.cliente_id).toBeNull();
      expect(req.request.body.ascensor_id).toBeNull();
      req.flush({ success: true });
    });
  });

  // ─── eliminar() ──────────────────────────────────────────────────────────────

  describe('eliminar()', () => {
    it('DELETE a la URL correcta', () => {
      service.eliminar(7).subscribe();
      const req = httpMock.expectOne(`${BASE_URL}/7`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });
});
