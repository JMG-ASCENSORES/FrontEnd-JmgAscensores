import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ConfiguracionService } from './configuracion.service';
import { environment } from '../../../../environments/environment';

const API_URL = `${environment.apiUrl}/configuracion`;

describe('ConfiguracionService', () => {
  let service: ConfiguracionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfiguracionService],
    });

    service = TestBed.inject(ConfiguracionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  // ---------------------------------------------------------------------------
  // getProfile()
  // ---------------------------------------------------------------------------

  describe('getProfile()', () => {
    it('hace GET a /configuracion/perfil y retorna los datos del perfil', () => {
      const mockProfile = { nombre: 'Admin', email: 'admin@jmg.com' };

      let result: any;
      service.getProfile().subscribe(res => (result = res));

      const req = httpMock.expectOne(`${API_URL}/perfil`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);

      expect(result).toEqual(mockProfile);
    });
  });

  // ---------------------------------------------------------------------------
  // updateProfile()
  // ---------------------------------------------------------------------------

  describe('updateProfile()', () => {
    it('hace PATCH a /configuracion/perfil con el body correcto', () => {
      const updateData = { nombre: 'Nuevo Nombre' };
      const mockResponse = { success: true, data: { nombre: 'Nuevo Nombre' } };

      let result: any;
      service.updateProfile(updateData).subscribe(res => (result = res));

      const req = httpMock.expectOne(`${API_URL}/perfil`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);

      expect(result).toEqual(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // getSystemSettings()
  // ---------------------------------------------------------------------------

  describe('getSystemSettings()', () => {
    it('hace GET a /configuracion/sistema y retorna la configuración del sistema', () => {
      const mockSettings = [
        { config_id: 1, clave: 'MAX_USERS', valor: '100', descripcion: 'Máximo de usuarios', tipo_dato: 'number', fecha_actualizacion: '2026-01-01' },
        { config_id: 2, clave: 'APP_NAME', valor: 'JMG Ascensores', descripcion: 'Nombre de la app', tipo_dato: 'string', fecha_actualizacion: '2026-01-01' },
      ];

      let result: any;
      service.getSystemSettings().subscribe(res => (result = res));

      const req = httpMock.expectOne(`${API_URL}/sistema`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSettings);

      expect(result).toEqual(mockSettings);
    });
  });

  // ---------------------------------------------------------------------------
  // updateSystemSetting()
  // ---------------------------------------------------------------------------

  describe('updateSystemSetting()', () => {
    it('hace PATCH a /configuracion/sistema/:clave con el valor correcto', () => {
      const clave = 'MAX_USERS';
      const valor = '200';
      const mockResponse = { success: true, message: 'Configuración actualizada' };

      let result: any;
      service.updateSystemSetting(clave, valor).subscribe(res => (result = res));

      const req = httpMock.expectOne(`${API_URL}/sistema/${clave}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ valor });
      req.flush(mockResponse);

      expect(result).toEqual(mockResponse);
    });

    it('usa la clave correctamente en la URL', () => {
      service.updateSystemSetting('APP_NAME', 'Nuevo Nombre').subscribe();

      const req = httpMock.expectOne(`${API_URL}/sistema/APP_NAME`);
      expect(req.request.method).toBe('PATCH');
      req.flush({});
    });
  });
});
