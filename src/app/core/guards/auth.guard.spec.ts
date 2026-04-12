import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceMock: { isAuthenticated: ReturnType<typeof vi.fn> };
  let routerMock: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: vi.fn()
    };

    routerMock = {
      createUrlTree: vi.fn((commands: any[]) => ({ commands } as unknown as UrlTree))
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should return true when user is authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
  });

  it('should redirect to /auth/login when user is not authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(false);

    TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should return a UrlTree when not authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(false);
    const fakeUrlTree = { commands: ['/auth/login'] } as unknown as UrlTree;
    routerMock.createUrlTree.mockReturnValue(fakeUrlTree);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(result).toBe(fakeUrlTree);
    expect(result).not.toBe(true);
    expect(result).not.toBe(false);
  });

  it('should call authService.isAuthenticated()', () => {
    authServiceMock.isAuthenticated.mockReturnValue(true);

    TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(authServiceMock.isAuthenticated).toHaveBeenCalledTimes(1);
  });
});
