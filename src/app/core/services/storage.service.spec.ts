import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    vi.spyOn(localStorage, 'setItem');
    vi.spyOn(localStorage, 'getItem');
    vi.spyOn(localStorage, 'removeItem');
    vi.spyOn(localStorage, 'clear');

    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  describe('token', () => {
    it('should save token to localStorage', () => {
      service.saveToken('my-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'my-token');
    });

    it('should get token from localStorage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('my-token');
      const result = service.getToken();
      expect(localStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(result).toBe('my-token');
    });

    it('should remove token from localStorage', () => {
      service.removeToken();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('refreshToken', () => {
    it('should save refresh token to localStorage', () => {
      service.saveRefreshToken('my-refresh-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'my-refresh-token');
    });

    it('should get refresh token from localStorage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('my-refresh-token');
      const result = service.getRefreshToken();
      expect(localStorage.getItem).toHaveBeenCalledWith('refresh_token');
      expect(result).toBe('my-refresh-token');
    });

    it('should remove refresh token from localStorage', () => {
      service.removeRefreshToken();
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('user', () => {
    const mockUser = { id: 1, nombre: 'Juan', rol: 'ADMIN' };

    it('should save user as JSON string to localStorage', () => {
      service.saveUser(mockUser);
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockUser));
    });

    it('should get user parsed from JSON in localStorage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockUser));
      const result = service.getUser();
      expect(localStorage.getItem).toHaveBeenCalledWith('auth_user');
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user in localStorage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      const result = service.getUser();
      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('should call localStorage.clear()', () => {
      service.clear();
      expect(localStorage.clear).toHaveBeenCalledTimes(1);
    });
  });
});
