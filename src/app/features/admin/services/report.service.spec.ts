import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReportService } from './report.service';
import { environment } from '../../../../environments/environment';
import { Report } from '../../../core/models/report.model';

const BASE = `${environment.apiUrl}/informes`;
const ORDERS_BASE = `${environment.apiUrl}/ordenes-trabajo`;
const TASKS_URL = `${environment.apiUrl}/tareas-maestras`;

const MOCK_REPORT: Report = {
  informe_id: 1,
  orden_id: 10,
  trabajador_id: 2,
  cliente_id: 3,
  ascensor_id: 4,
  tipo_informe: 'mantenimiento',
  descripcion_trabajo: 'Revisión general',
  fecha_informe: '2026-01-01',
  hora_informe: '09:00',
  fecha_creacion: '2026-01-01T09:00:00Z',
};

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('token', 'fake-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportService],
    });

    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  // ─── getReports ────────────────────────────────────────────────────────────

  describe('getReports()', () => {
    it('sin filtros → GET a /informes sin query params', () => {
      service.getReports().subscribe();

      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys()).toHaveLength(0);
      req.flush({ data: { informes: [], meta: {} } });
    });

    it('con tipo_informe → incluye ese param', () => {
      service.getReports({ tipo_informe: 'mantenimiento' }).subscribe();

      const req = httpMock.expectOne(`${BASE}?tipo_informe=mantenimiento`);
      expect(req.request.params.get('tipo_informe')).toBe('mantenimiento');
      req.flush({ data: { informes: [], meta: {} } });
    });

    it('con page y limit → incluye esos params', () => {
      service.getReports({ page: 2, limit: 10 }).subscribe();

      const req = httpMock.expectOne(`${BASE}?page=2&limit=10`);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush({ data: { informes: [], meta: {} } });
    });

    it('envelope A (data.informes) → retorna { informes, meta }', () => {
      const meta = { total: 1, page: 1 };
      let result: any;

      service.getReports().subscribe(r => (result = r));

      httpMock
        .expectOne(BASE)
        .flush({ data: { informes: [MOCK_REPORT], meta } });

      expect(result.informes).toEqual([MOCK_REPORT]);
      expect(result.meta).toEqual(meta);
    });

    it('envelope B (data array) → retorna { informes: data, meta: {} }', () => {
      let result: any;

      service.getReports().subscribe(r => (result = r));

      httpMock.expectOne(BASE).flush({ data: [MOCK_REPORT] });

      expect(result.informes).toEqual([MOCK_REPORT]);
      expect(result.meta).toEqual({});
    });
  });

  // ─── getReportById ─────────────────────────────────────────────────────────

  describe('getReportById()', () => {
    it('GET /informes/:id → retorna response.data', () => {
      let result: Report | undefined;

      service.getReportById(1).subscribe(r => (result = r));

      httpMock.expectOne(`${BASE}/1`).flush({ data: MOCK_REPORT });

      expect(result).toEqual(MOCK_REPORT);
    });
  });

  // ─── createReport ──────────────────────────────────────────────────────────

  describe('createReport()', () => {
    it('POST /informes con body → retorna response.data', () => {
      const payload = { tipo_informe: 'correctivo', descripcion_trabajo: 'Arreglo' };
      let result: Report | undefined;

      service.createReport(payload).subscribe(r => (result = r));

      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ data: MOCK_REPORT });

      expect(result).toEqual(MOCK_REPORT);
    });
  });

  // ─── updateReport ──────────────────────────────────────────────────────────

  describe('updateReport()', () => {
    it('PUT /informes/:id → retorna response.data', () => {
      const payload = { descripcion_trabajo: 'Actualizado' };
      let result: Report | undefined;

      service.updateReport(1, payload).subscribe(r => (result = r));

      const req = httpMock.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ data: MOCK_REPORT });

      expect(result).toEqual(MOCK_REPORT);
    });
  });

  // ─── patchReport ───────────────────────────────────────────────────────────

  describe('patchReport()', () => {
    it('PATCH /informes/:id con delta → retorna response.data', () => {
      const delta = { tipo_informe: 'correctivo' };
      let result: Report | undefined;

      service.patchReport(1, delta).subscribe(r => (result = r));

      const req = httpMock.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(delta);
      req.flush({ data: MOCK_REPORT });

      expect(result).toEqual(MOCK_REPORT);
    });
  });

  // ─── deleteReport ──────────────────────────────────────────────────────────

  describe('deleteReport()', () => {
    it('DELETE /informes/:id → completa sin error', () => {
      let completed = false;

      service.deleteReport(1).subscribe({ complete: () => (completed = true) });

      const req = httpMock.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(completed).toBe(true);
    });
  });

  // ─── downloadReportPdf ─────────────────────────────────────────────────────

  describe('downloadReportPdf()', () => {
    it('GET /informes/:id/pdf → retorna Blob', () => {
      let result: Blob | undefined;

      service.downloadReportPdf(1).subscribe(b => (result = b));

      const req = httpMock.expectOne(`${BASE}/1/pdf`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['%PDF'], { type: 'application/pdf' }));

      expect(result).toBeInstanceOf(Blob);
    });
  });

  // ─── getWorkOrderById ──────────────────────────────────────────────────────

  describe('getWorkOrderById()', () => {
    it('GET /ordenes-trabajo/:id → retorna response.data', () => {
      const mockOrder = { orden_id: 10, estado: 'pendiente' };
      let result: any;

      service.getWorkOrderById(10).subscribe(r => (result = r));

      httpMock.expectOne(`${ORDERS_BASE}/10`).flush({ data: mockOrder });

      expect(result).toEqual(mockOrder);
    });
  });

  // ─── updateWorkOrder ───────────────────────────────────────────────────────

  describe('updateWorkOrder()', () => {
    it('PUT /ordenes-trabajo/:id → retorna response.data', () => {
      const payload = { estado: 'completado' };
      const mockOrder = { orden_id: 10, estado: 'completado' };
      let result: any;

      service.updateWorkOrder(10, payload).subscribe(r => (result = r));

      const req = httpMock.expectOne(`${ORDERS_BASE}/10`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ data: mockOrder });

      expect(result).toEqual(mockOrder);
    });
  });

  // ─── patchOrdenEstado ──────────────────────────────────────────────────────

  describe('patchOrdenEstado()', () => {
    it('PATCH /ordenes-trabajo/:id/estado con { estado } → retorna response.data', () => {
      const mockOrder = { orden_id: 10, estado: 'en_proceso' };
      let result: any;

      service.patchOrdenEstado(10, 'en_proceso').subscribe(r => (result = r));

      const req = httpMock.expectOne(`${ORDERS_BASE}/10/estado`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ estado: 'en_proceso' });
      req.flush({ data: mockOrder });

      expect(result).toEqual(mockOrder);
    });
  });

  // ─── getStandardTasks ──────────────────────────────────────────────────────

  describe('getStandardTasks()', () => {
    it('GET /tareas-maestras → retorna response.data', () => {
      const mockTasks = [{ tarea_id: 1, descripcion_tarea: 'Lubricar puertas' }];
      let result: any[];

      service.getStandardTasks().subscribe(r => (result = r));

      httpMock.expectOne(TASKS_URL).flush({ data: mockTasks });

      expect(result!).toEqual(mockTasks);
    });
  });

});
