import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkerService, WorkerProfile, UpdateProfilePayload } from './worker.service';
import { environment } from '../../../../environments/environment';

const ME_URL = `${environment.apiUrl}/usuarios/me`;

const MOCK_PROFILE: WorkerProfile = {
  trabajador_id: 1,
  dni: '12345678',
  nombre: 'Juan',
  apellido: 'Pérez',
  correo: 'juan@ejemplo.com',
  telefono: '1122334455',
  especialidad: 'Hidráulicos',
};

describe('WorkerService', () => {
  let service: WorkerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('token', 'fake-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WorkerService],
    });

    service = TestBed.inject(WorkerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  // ─── getMyProfile ──────────────────────────────────────────────────────────

  describe('getMyProfile()', () => {
    it('GET /usuarios/me → retorna response.data', () => {
      let result: WorkerProfile | undefined;

      service.getMyProfile().subscribe(r => (result = r));

      const req = httpMock.expectOne(ME_URL);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: MOCK_PROFILE });

      expect(result).toEqual(MOCK_PROFILE);
    });

  });

  // ─── updateMyProfile ───────────────────────────────────────────────────────

  describe('updateMyProfile()', () => {
    it('PUT /usuarios/me con payload → retorna response.data', () => {
      const payload: UpdateProfilePayload = {
        nombre: 'Carlos',
        apellido: 'García',
        correo: 'carlos@ejemplo.com',
      };
      const updated: WorkerProfile = { ...MOCK_PROFILE, ...payload };
      let result: WorkerProfile | undefined;

      service.updateMyProfile(payload).subscribe(r => (result = r));

      const req = httpMock.expectOne(ME_URL);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: updated });

      expect(result).toEqual(updated);
    });

    it('el body del PUT es exactamente el payload recibido', () => {
      const payload: UpdateProfilePayload = {
        telefono: '9988776655',
        contrasena_hash: 'nueva-pass',
      };

      service.updateMyProfile(payload).subscribe();

      const req = httpMock.expectOne(ME_URL);
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: MOCK_PROFILE });
    });

  });
});
