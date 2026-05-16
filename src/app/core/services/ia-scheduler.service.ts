import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  DemandResponse,
  TecnicosResponse,
  Propuesta,
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

  /**
   * Obtener pool de trabajos pendientes para una fecha.
   */
  getDemand(fecha: string): Observable<DemandResponse> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<DemandResponse>(`${this.base}/demand`, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching demand:', error);
        return throwError(() => new Error(error.error?.error || 'Error al cargar la demanda'));
      })
    );
  }

  /**
   * Obtener técnicos disponibles con su carga preexistente.
   */
  getTecnicos(fecha: string): Observable<TecnicosResponse> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<TecnicosResponse>(`${this.base}/tecnicos`, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching tecnicos:', error);
        return throwError(() => new Error(error.error?.error || 'Error al cargar los técnicos'));
      })
    );
  }

  /**
   * Generar propuesta de programación (motor + LLM en cascada).
   */
  generar(body: GenerarRequest): Observable<Propuesta> {
    return this.http.post<Propuesta>(`${this.base}/generar`, body).pipe(
      catchError((error) => {
        console.error('Error generating proposal:', error);
        return throwError(() => new Error(error.error?.error || 'Error al generar la propuesta'));
      })
    );
  }

  /**
   * Ajustar propuesta con instrucción en lenguaje natural (chat).
   */
  ajustar(body: AjustarRequest): Observable<Propuesta> {
    return this.http.post<Propuesta>(`${this.base}/ajustar`, body).pipe(
      catchError((error) => {
        console.error('Error adjusting proposal:', error);
        return throwError(() => new Error(error.error?.error || 'Error al ajustar la propuesta'));
      })
    );
  }

  /**
   * Confirmar y persistir propuesta en BD (transacción atómica).
   */
  confirmar(body: ConfirmarRequest): Observable<ConfirmarResponse> {
    return this.http.post<ConfirmarResponse>(`${this.base}/confirmar`, body).pipe(
      catchError((error) => {
        console.error('Error confirming proposal:', error);
        const message =
          error.status === 409
            ? error.error?.error || 'Conflicto: la propuesta fue modificada. Regenerá.'
            : error.error?.error || 'Error al confirmar la propuesta';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Obtener configuración actual del módulo.
   */
  getConfiguracion(): Observable<ConfigResponse> {
    return this.http.get<ConfigResponse>(`${this.base}/configuracion`).pipe(
      catchError((error) => {
        console.error('Error fetching config:', error);
        return throwError(() => new Error(error.error?.error || 'Error al cargar la configuración'));
      })
    );
  }

  /**
   * Actualizar configuración del módulo (admin).
   */
  updateConfiguracion(body: UpdateConfigRequest): Observable<UpdateConfigResponse> {
    return this.http.put<UpdateConfigResponse>(`${this.base}/configuracion`, body).pipe(
      catchError((error) => {
        console.error('Error updating config:', error);
        return throwError(() => new Error(error.error?.error || 'Error al actualizar la configuración'));
      })
    );
  }
}
