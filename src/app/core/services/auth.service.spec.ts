import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { AuthResponse, User } from '../models/auth.models';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storageServiceMock: any;
  let routerMock: any;

  const mockUser: User = {
    id: 1,
    dni: '12345678',
    nombre: 'Juan',
    apellido: 'Pérez',
    correo: 'juan@example.com',
    rol: 'ADMIN',
    tipo: 'administrador'
  };

  const mockAuthResponse: AuthResponse = {
    success: true,
    message: 'Login exitoso',
    data: {
      user: mockUser,
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456'
    }
  };

  beforeEach(() => {
    // Crear mocks de las dependencias usando Vitest
    storageServiceMock = {
      saveToken: vi.fn(),
      saveRefreshToken: vi.fn(),
      saveUser: vi.fn(),
      getUser: vi.fn(() => null),
      getToken: vi.fn(),
      getRefreshToken: vi.fn(),
      removeToken: vi.fn(),
      removeRefreshToken: vi.fn(),
      clear: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: StorageService, useValue: storageServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verificar que no hay requests HTTP pendientes
    httpMock.verify();
  });

  describe('login()', () => {
    it('should save token and user to storage on successful login', () => {
      const credentials = { dni: '12345678', contrasena: 'password123' };
      let receivedUser: User | undefined;

      service.login(credentials).subscribe((user) => {
        receivedUser = user;
      });

      // Responder la request HTTP
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockAuthResponse);

      // Assertions
      expect(storageServiceMock.saveToken).toHaveBeenCalledWith('access-token-123');
      expect(storageServiceMock.saveRefreshToken).toHaveBeenCalledWith('refresh-token-456');
      expect(storageServiceMock.saveUser).toHaveBeenCalledWith(mockUser);
      expect(receivedUser).toEqual(mockUser);
    });

    it('should update currentUser signal on successful login', () => {
      const credentials = { dni: '12345678', contrasena: 'password123' };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockAuthResponse);

      // currentUser es un computed que lee de currentUserSig
      expect(service.currentUser()).toEqual(mockUser);
    });

    it('should set isAuthenticated to true after successful login', () => {
      const credentials = { dni: '12345678', contrasena: 'password123' };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockAuthResponse);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should set isAdmin to true when user role is ADMIN', () => {
      const credentials = { dni: '12345678', contrasena: 'password123' };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockAuthResponse);

      expect(service.isAdmin()).toBe(true);
    });

    it('should set isAdmin to false when user role is not ADMIN', () => {
      const tecnicoUser: User = { ...mockUser, rol: 'TECNICO' };
      const tecnicoResponse: AuthResponse = { ...mockAuthResponse, data: { ...mockAuthResponse.data, user: tecnicoUser } };

      const credentials = { dni: '12345678', contrasena: 'password123' };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(tecnicoResponse);

      expect(service.isAdmin()).toBe(false);
    });

    it('should throw error when response.success is false', () => {
      const credentials = { dni: '12345678', contrasena: 'wrongpassword' };
      const errorResponse: AuthResponse = {
        success: false,
        message: 'Credenciales inválidas',
        data: {
          user: {} as User,
          accessToken: '',
          refreshToken: ''
        }
      };

      let errorThrown: any = null;

      service.login(credentials).subscribe(
        () => {
          throw new Error('should have thrown error');
        },
        (error) => {
          errorThrown = error;
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(errorResponse);

      expect(errorThrown?.message).toBe('Credenciales inválidas');
      expect(storageServiceMock.saveToken).not.toHaveBeenCalled();
    });

    it('should not save token if response.data is null', () => {
      const credentials = { dni: '12345678', contrasena: 'password123' };
      const invalidResponse: AuthResponse = {
        success: true,
        message: 'Login exitoso',
        data: {
          user: mockUser,
          accessToken: '',
          refreshToken: ''
        }
      };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(invalidResponse);

      // El response.success es true pero accessToken es vacío
      // Debería no guardar token
      expect(storageServiceMock.saveToken).not.toHaveBeenCalled();
    });

    it('should throw generic error when response.message is missing', () => {
      const credentials = { dni: '12345678', contrasena: 'password123' };
      const errorResponse: AuthResponse = {
        success: false,
        message: '',
        data: {
          user: {} as User,
          accessToken: '',
          refreshToken: ''
        }
      };

      let errorThrown: any = null;

      service.login(credentials).subscribe(
        () => {
          throw new Error('should have thrown error');
        },
        (error) => {
          errorThrown = error;
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(errorResponse);

      expect(errorThrown?.message).toBe('Login failed');
    });
  });

  describe('logout()', () => {
    it('should clear storage and redirect to login on logout', () => {
      storageServiceMock.getRefreshToken.mockReturnValue('refresh-token-456');

      service.logout();

      // Esperar a que se haga la request HTTP y responder
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({ success: true });

      expect(storageServiceMock.clear).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should clear session even if logout API fails', () => {
      storageServiceMock.getRefreshToken.mockReturnValue('refresh-token-456');

      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.error(new ErrorEvent('Network error'));

      expect(storageServiceMock.clear).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should clear session if no refresh token exists', () => {
      storageServiceMock.getRefreshToken.mockReturnValue(null);

      service.logout();

      // No debe hacer request HTTP
      httpMock.expectNone(`${environment.apiUrl}/auth/logout`);

      expect(storageServiceMock.clear).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should set currentUser signal to null after logout', () => {
      storageServiceMock.getRefreshToken.mockReturnValue('refresh-token-456');

      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({ success: true });

      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshToken()', () => {
    it('should save new access token on successful refresh', () => {
      const newAccessToken = 'new-access-token-789';
      const refreshResponse = {
        success: true,
        data: {
          accessToken: newAccessToken
        }
      };

      storageServiceMock.getRefreshToken.mockReturnValue('refresh-token-456');
      let receivedToken: string | undefined;

      service.refreshToken().subscribe((token) => {
        receivedToken = token;
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.body).toEqual({ refreshToken: 'refresh-token-456' });
      req.flush(refreshResponse);

      expect(storageServiceMock.saveToken).toHaveBeenCalledWith(newAccessToken);
      expect(receivedToken).toBe(newAccessToken);
    });

    it('should throw error when refresh token fails', () => {
      const errorResponse = {
        success: false,
        data: null
      };

      storageServiceMock.getRefreshToken.mockReturnValue('refresh-token-456');
      let errorThrown: any = null;

      service.refreshToken().subscribe(
        () => {
          throw new Error('should have thrown error');
        },
        (error) => {
          errorThrown = error;
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      req.flush(errorResponse);

      expect(errorThrown?.message).toBe('No se pudo renovar el token');
      expect(storageServiceMock.saveToken).not.toHaveBeenCalled();
    });
  });

  describe('forceLogout()', () => {
    it('should clear session and redirect without calling backend', () => {
      service.forceLogout();

      // No debe hacer request HTTP
      httpMock.expectNone(`${environment.apiUrl}/auth/logout`);

      expect(storageServiceMock.clear).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('computed properties', () => {
    it('should have isAuthenticated false when currentUser is null', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should have isAdmin false when currentUser is null', () => {
      expect(service.isAdmin()).toBe(false);
    });

    it('should have currentUser null on initialization', () => {
      expect(service.currentUser()).toBeNull();
    });
  });
});
