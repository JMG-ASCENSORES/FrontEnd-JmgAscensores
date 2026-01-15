import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

// Variables de estado para el manejo de refresh token (Fuera de la función para persistir estado)
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const authService = inject(AuthService);
  
  const token = storageService.getToken();
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Si el error es 401 (Unauthorized) y NO es una petición de Auth
      if (
        error instanceof HttpErrorResponse && 
        error.status === 401 && 
        !req.url.includes('/auth/login') && 
        !req.url.includes('/auth/refresh')
      ) {
        return handle401Error(authReq, next, authService);
      }

      return throwError(() => error);
    })
  );
};

// Función auxiliar para gestionar la renovación
const handle401Error = (request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService) => {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((newToken: any) => {
        isRefreshing = false;
        refreshTokenSubject.next(newToken);
        
        // Clonar y reintentar la petición original con el nuevo token
        return next(request.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`
          }
        }));
      }),
      catchError((err) => {
        isRefreshing = false;
        // Si el refresh falla (por ejemplo, refresh token expirado), hacemos logout forzoso
        authService.forceLogout();
        return throwError(() => err);
      })
    );
  } else {
    // Si ya estamos refrescando, esperamos a que termine
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        return next(request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        }));
      })
    );
  }
};

