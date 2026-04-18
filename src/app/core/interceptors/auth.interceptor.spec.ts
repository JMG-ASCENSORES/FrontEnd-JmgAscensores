import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: any;
  let storageServiceMock: any;

  beforeEach(() => {
    authServiceMock = {
      refreshToken: vi.fn(),
      forceLogout: vi.fn(),
    };
    storageServiceMock = {
      getToken: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: StorageService, useValue: storageServiceMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('agrega header Authorization cuando hay token válido', () => {
    storageServiceMock.getToken.mockReturnValue('valid-token');

    http.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
    req.flush({});
  });

  it('no agrega header Authorization cuando no hay token', () => {
    storageServiceMock.getToken.mockReturnValue(null);

    http.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('no agrega header Authorization cuando token es "undefined"', () => {
    storageServiceMock.getToken.mockReturnValue('undefined');

    http.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('llama refreshToken y reintenta la petición original en error 401', () => {
    storageServiceMock.getToken.mockReturnValue('expired-token');
    authServiceMock.refreshToken.mockReturnValue(of('new-token'));

    http.get('/api/protected').subscribe();

    const req = httpMock.expectOne('/api/protected');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    const retried = httpMock.expectOne('/api/protected');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer new-token');
    retried.flush({ data: 'ok' });

    expect(authServiceMock.refreshToken).toHaveBeenCalledOnce();
  });

  it('llama forceLogout cuando refreshToken falla', () => {
    storageServiceMock.getToken.mockReturnValue('expired-token');
    authServiceMock.refreshToken.mockReturnValue(throwError(() => new Error('refresh failed')));

    http.get('/api/protected').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/protected');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.forceLogout).toHaveBeenCalledOnce();
  });

  it('no maneja 401 en rutas de auth (/auth/login)', () => {
    storageServiceMock.getToken.mockReturnValue('token');

    http.post('/auth/login', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/auth/login');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.refreshToken).not.toHaveBeenCalled();
  });

  it('no maneja 401 en rutas de auth (/auth/refresh)', () => {
    storageServiceMock.getToken.mockReturnValue('token');

    http.post('/auth/refresh', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/auth/refresh');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.refreshToken).not.toHaveBeenCalled();
  });
});
