import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Elevator } from '../../../core/models/elevator.model';
import { environment } from '../../../../environments/environment';

export interface ElevatorApiResponse {
  success: boolean;
  message: string;
  data: Elevator[] | Elevator;
  timestamp?: string;
  meta?: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ElevatorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ascensores`;

  getElevators(clientId?: number, tipoEquipo?: string): Observable<Elevator[]> {
    let url = this.apiUrl;
    const params: string[] = [];

    if (clientId) params.push(`cliente_id=${clientId}`);
    if (tipoEquipo) params.push(`tipo_equipo=${tipoEquipo}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<ElevatorApiResponse>(url)
      .pipe(
        map(response => Array.isArray(response.data) ? response.data : [response.data]),
        catchError(error => {
          console.error('Error fetching elevators:', error);
          if (error.status === 401) {
             return throwError(() => new Error('No autorizado.'));
          }
          return throwError(() => new Error('Error al cargar equipos.'));
        })
      );
  }

  getElevatorsPaginated(page: number, limit: number, search?: string, clienteId?: number | null, tipoEquipo?: string, estado?: string): Observable<ElevatorApiResponse> {
    let params: any = { page: page.toString(), limit: limit.toString() };
    if (search) params.search = search;
    if (clienteId) params.cliente_id = clienteId.toString();
    if (tipoEquipo) params.tipo_equipo = tipoEquipo;
    if (estado) params.estado = estado;
    
    return this.http.get<ElevatorApiResponse>(this.apiUrl, { params }).pipe(
      catchError(error => {
        console.error('Error fetching paginated elevators:', error);
        if (error.status === 401) {
           return throwError(() => new Error('No autorizado.'));
        }
        return throwError(() => new Error('Error al cargar equipos.'));
      })
    );
  }

  getElevatorById(id: number): Observable<Elevator> {
    return this.http.get<ElevatorApiResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data as Elevator),
        catchError(error => {
          console.error('Error fetching elevator:', error);
          if (error.status === 404) {
            return throwError(() => new Error('Equipo no encontrado.'));
          }
          return throwError(() => new Error('Error al cargar equipo.'));
        })
      );
  }

  createElevator(elevator: Partial<Elevator>): Observable<Elevator> {
    return this.http.post<ElevatorApiResponse>(this.apiUrl, elevator)
      .pipe(
        map(response => response.data as Elevator),
        catchError(error => {
          console.error('Error creating elevator:', error);
          if (error.status === 400) {
            return throwError(() => new Error(error.error?.message || 'Datos inválidos.'));
          }
          if (error.status === 404) {
            return throwError(() => new Error('Cliente no encontrado.'));
          }
          return throwError(() => new Error('Error al crear equipo.'));
        })
      );
  }

  updateElevator(id: number, elevator: Partial<Elevator>): Observable<Elevator> {
    return this.http.put<ElevatorApiResponse>(`${this.apiUrl}/${id}`, elevator)
      .pipe(
        map(response => response.data as Elevator),
        catchError(error => {
          console.error('Error updating elevator:', error);
          if (error.status === 404) {
            return throwError(() => new Error('Equipo no encontrado.'));
          }
          if (error.status === 400) {
            return throwError(() => new Error(error.error?.message || 'Datos inválidos.'));
          }
          return throwError(() => new Error('Error al actualizar equipo.'));
        })
      );
  }

  deleteElevator(id: number): Observable<void> {
    return this.http.delete<ElevatorApiResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => void 0),
        catchError(error => {
          console.error('Error deleting elevator:', error);
          if (error.status === 404) {
            return throwError(() => new Error('Equipo no encontrado.'));
          }
          return throwError(() => new Error('Error al eliminar equipo.'));
        })
      );
  }
}
