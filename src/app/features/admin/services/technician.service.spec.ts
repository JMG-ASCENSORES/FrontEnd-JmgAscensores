import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { TechnicianService, Technician } from './technician.service';
import { environment } from '../../../../environments/environment';

const API_URL = `${environment.apiUrl}/usuarios`;

const mockBackendItem = {
  trabajador_id: 1,
  nombre: 'Juan',
  apellido: 'Pérez',
  dni: '12345678',
  edad: 35,
  correo: 'juan@example.com',
  telefono: '1122334455',
  especialidad: 'Hidráulica',
  foto_perfil: 'https://cdn.example.com/foto.jpg',
  estado_activo: true,
  fecha_creacion: '2024-01-01T00:00:00.000Z',
  fecha_actualizacion: '2024-06-01T00:00:00.000Z',
};

const expectedTechnician: Technician = {
  id: 1,
  nombre: 'Juan',
  apellido: 'Pérez',
  dni: '12345678',
  edad: 35,
  correo: 'juan@example.com',
  telefono: '1122334455',
  especialidad: 'Hidráulica',
  foto: 'https://cdn.example.com/foto.jpg',
  estado_activo: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-06-01T00:00:00.000Z',
};

describe('TechnicianService', () => {
  let service: TechnicianService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TechnicianService],
    });

    service = TestBed.inject(TechnicianService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ---------------------------------------------------------------------------
  // getTechnicians()
  // ---------------------------------------------------------------------------

  describe('getTechnicians()', () => {
    it('sin filtros: hace GET a /usuarios sin query params', () => {
      let result: Technician[] | undefined;

      service.getTechnicians().subscribe(techs => (result = techs));

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);

      req.flush({ data: [mockBackendItem] });

      expect(result).toHaveLength(1);
    });

    it('con filtro especialidad: URL incluye el param especialidad', () => {
      service.getTechnicians({ especialidad: 'Hidráulica' }).subscribe();

      const req = httpMock.expectOne(r => r.url === API_URL);
      expect(req.request.params.get('especialidad')).toBe('Hidráulica');
      expect(req.request.params.has('estado_activo')).toBe(false);

      req.flush({ data: [] });
    });

    it('con filtro estado_activo true: URL incluye el param estado_activo', () => {
      service.getTechnicians({ estado_activo: true }).subscribe();

      const req = httpMock.expectOne(r => r.url === API_URL);
      expect(req.request.params.get('estado_activo')).toBe('true');
      expect(req.request.params.has('especialidad')).toBe(false);

      req.flush({ data: [] });
    });

    it('con ambos filtros: URL incluye especialidad y estado_activo', () => {
      service.getTechnicians({ especialidad: 'Eléctrica', estado_activo: false }).subscribe();

      const req = httpMock.expectOne(r => r.url === API_URL);
      expect(req.request.params.get('especialidad')).toBe('Eléctrica');
      expect(req.request.params.get('estado_activo')).toBe('false');

      req.flush({ data: [] });
    });

    it('mapea trabajador_id → id', () => {
      let result: Technician[] | undefined;
      service.getTechnicians().subscribe(techs => (result = techs));

      httpMock.expectOne(API_URL).flush({ data: [mockBackendItem] });

      expect(result![0].id).toBe(mockBackendItem.trabajador_id);
    });

    it('mapea foto_perfil → foto', () => {
      let result: Technician[] | undefined;
      service.getTechnicians().subscribe(techs => (result = techs));

      httpMock.expectOne(API_URL).flush({ data: [mockBackendItem] });

      expect(result![0].foto).toBe(mockBackendItem.foto_perfil);
    });

    it('mapea fecha_creacion → createdAt y fecha_actualizacion → updatedAt', () => {
      let result: Technician[] | undefined;
      service.getTechnicians().subscribe(techs => (result = techs));

      httpMock.expectOne(API_URL).flush({ data: [mockBackendItem] });

      expect(result![0].createdAt).toBe(mockBackendItem.fecha_creacion);
      expect(result![0].updatedAt).toBe(mockBackendItem.fecha_actualizacion);
    });

    it('mapeo completo: todos los campos coinciden con el modelo Technician', () => {
      let result: Technician[] | undefined;
      service.getTechnicians().subscribe(techs => (result = techs));

      httpMock.expectOne(API_URL).flush({ data: [mockBackendItem] });

      expect(result![0]).toEqual(expectedTechnician);
    });

    it('cuando response.data es undefined devuelve array vacío', () => {
      let result: Technician[] | undefined;
      service.getTechnicians().subscribe(techs => (result = techs));

      httpMock.expectOne(API_URL).flush({});

      expect(result).toEqual([]);
    });

    it('cuando response.data es null devuelve array vacío', () => {
      let result: Technician[] | undefined;
      service.getTechnicians().subscribe(techs => (result = techs));

      httpMock.expectOne(API_URL).flush({ data: null });

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // createTechnician()
  // ---------------------------------------------------------------------------

  describe('createTechnician()', () => {
    const newTechnicianPayload = {
      nombre: 'Ana',
      apellido: 'García',
      dni: '87654321',
      especialidad: 'Eléctrica',
    };

    it('hace POST a /usuarios con el body correcto', () => {
      service.createTechnician(newTechnicianPayload).subscribe();

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTechnicianPayload);

      req.flush({ data: { ...expectedTechnician, id: 2 } });
    });

    it('devuelve response.data como Technician creado', () => {
      const created = { ...expectedTechnician, id: 2 };
      let result: Technician | undefined;

      service.createTechnician(newTechnicianPayload).subscribe(tech => (result = tech));

      httpMock.expectOne(API_URL).flush({ data: created });

      expect(result).toEqual(created);
    });
  });

  // ---------------------------------------------------------------------------
  // updateTechnician()
  // ---------------------------------------------------------------------------

  describe('updateTechnician()', () => {
    const updatePayload = { especialidad: 'Mecánica' };

    it('hace PUT a /usuarios/:id con el id correcto', () => {
      service.updateTechnician(1, updatePayload).subscribe();

      const req = httpMock.expectOne(`${API_URL}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatePayload);

      req.flush({ data: expectedTechnician });
    });

    it('devuelve response.data como Technician actualizado', () => {
      const updated = { ...expectedTechnician, especialidad: 'Mecánica' };
      let result: Technician | undefined;

      service.updateTechnician(1, updatePayload).subscribe(tech => (result = tech));

      httpMock.expectOne(`${API_URL}/1`).flush({ data: updated });

      expect(result).toEqual(updated);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteTechnician()
  // ---------------------------------------------------------------------------

  describe('deleteTechnician()', () => {
    it('hace DELETE a /usuarios/:id con el id correcto', () => {
      service.deleteTechnician(5).subscribe();

      const req = httpMock.expectOne(`${API_URL}/5`);
      expect(req.request.method).toBe('DELETE');

      req.flush(null);
    });

    it('completa el observable sin emitir valor', () => {
      let emittedValue: unknown = 'NOT_CALLED';
      let completed = false;

      service.deleteTechnician(5).subscribe({
        next: v => (emittedValue = v),
        complete: () => (completed = true),
      });

      httpMock.expectOne(`${API_URL}/5`).flush(null);

      expect(completed).toBe(true);
      expect(emittedValue).toBeNull();
    });
  });
});
