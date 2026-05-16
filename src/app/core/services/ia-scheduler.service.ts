import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  DemandResponse,
  TecnicosResponse,
  SugerenciaResponse,
  GenerarRequest,
  AjustarRequest,
  ConfirmarRequest,
  ConfirmarResponse,
  ConfigResponse,
  UpdateConfigRequest,
  UpdateConfigResponse,
} from '../../features/admin/models/ia-scheduler.interface';

@Injectable({
  providedIn: 'root',
})
export class IaSchedulerService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ia-scheduler`;

  getDemand(fecha: string): Observable<DemandResponse> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<DemandResponse>(`${this.base}/demand`, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching demand:', error);
        return throwError(() => new Error(error.error?.error || 'Error al cargar contexto de mantenimientos'));
      })
    );
  }

  getTecnicos(fecha: string): Observable<TecnicosResponse> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<TecnicosResponse>(`${this.base}/tecnicos`, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching tecnicos:', error);
        return throwError(() => new Error(error.error?.error || 'Error al cargar los técnicos'));
      })
    );
  }

  generar(body: GenerarRequest): Observable<SugerenciaResponse> {
    return this.http.post<SugerenciaResponse>(`${this.base}/generar`, body).pipe(
      catchError((error) => {
        console.error('Error generating suggestion:', error);
        return throwError(() => new Error(error.error?.error || 'Error al buscar técnico óptimo'));
      })
    );
  }

  ajustar(body: AjustarRequest): Observable<SugerenciaResponse> {
    return this.http.post<SugerenciaResponse>(`${this.base}/ajustar`, body).pipe(
      catchError((error) => {
        console.error('Error adjusting suggestion:', error);
        return throwError(() => new Error(error.error?.error || 'Error al ajustar la sugerencia'));
      })
    );
  }

  confirmar(body: ConfirmarRequest): Observable<ConfirmarResponse> {
    return this.http.post<ConfirmarResponse>(`${this.base}/confirmar`, body).pipe(
      catchError((error) => {
        console.error('Error confirming:', error);
        const message =
          error.status === 400
            ? error.error?.error || 'Datos inválidos para confirmar la programación'
            : error.error?.error || 'Error al confirmar la programación';
        return throwError(() => new Error(message));
      })
    );
  }

  getConfiguracion(): Observable<ConfigResponse> {
    return this.http.get<ConfigResponse>(`${this.base}/configuracion`).pipe(
      catchError((error) => {
        console.error('Error fetching config:', error);
        return throwError(() => new Error(error.error?.error || 'Error al cargar la configuración'));
      })
    );
  }

  updateConfiguracion(body: UpdateConfigRequest): Observable<UpdateConfigResponse> {
    return this.http.put<UpdateConfigResponse>(`${this.base}/configuracion`, body).pipe(
      catchError((error) => {
        console.error('Error updating config:', error);
        return throwError(() => new Error(error.error?.error || 'Error al actualizar la configuración'));
      })
    );
  }
}
