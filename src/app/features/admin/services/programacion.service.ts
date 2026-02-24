import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

// ============= INTERFACES =============

export type TipoTrabajo = 'mantenimiento' | 'reparacion' | 'inspeccion' | 'emergencia';
export type EstadoProgramacion = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

// Formato que devuelve el backend
export interface ProgramacionAPI {
  id: number;
  title: string;
  start: string;
  end: string;
  color: string;
  extendedProps: {
    trabajador_id: number;
    cliente_id?: number;
    ascensor_id?: number;
    tipo_trabajo: TipoTrabajo;
    estado: EstadoProgramacion;
    descripcion?: string;
    trabajador?: Trabajador;
    cliente?: Cliente;
    ascensor?: Ascensor;
  };
}

// Formato interno del frontend
export interface Programacion {
  programacion_id: number;
  titulo: string;
  fecha_inicio: string; // ISO 8601 format
  fecha_fin: string; // ISO 8601 format
  trabajador_id: number;
  cliente_id?: number;
  ascensor_id?: number;
  tipo_trabajo: TipoTrabajo;
  estado: EstadoProgramacion;
  descripcion?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  
  // Relaciones (populated by backend)
  trabajador?: Trabajador;
  cliente?: Cliente;
  ascensor?: Ascensor;
}

export interface Trabajador {
  usuario_id: number;
  nombre: string;
  apellido: string;
  email: string;
  especialidad?: string;
}

export interface Cliente {
  cliente_id: number;
  nombre_comercial?: string;
  contacto_nombre?: string;
  contacto_apellido?: string;
  tipo_cliente?: string;
}

export interface Ascensor {
  ascensor_id: number;
  cliente_id: number;
  tipo_equipo: string;
  marca: string;
  modelo?: string;
  numero_serie?: string;
  estado?: string;
}

export interface CrearProgramacionDTO {
  titulo: string;
  start: string; // ISO 8601: "2026-02-20T08:00:00"
  end: string; // ISO 8601: "2026-02-20T11:00:00"
  trabajador_id: number;
  cliente_id?: number;
  ascensor_id?: number;
  tipo_trabajo: TipoTrabajo;
  descripcion?: string;
}

export interface ActualizarProgramacionDTO {
  titulo?: string;
  start?: string;
  end?: string;
  trabajador_id?: number;
  cliente_id?: number;
  ascensor_id?: number;
  tipo_trabajo?: TipoTrabajo;
  estado?: EstadoProgramacion;
  descripcion?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

// ============= SERVICE =============

@Injectable({
  providedIn: 'root'
})
export class ProgramacionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/programaciones';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtener programaciones por rango de fechas
   * @param start Fecha inicio en formato ISO (YYYY-MM-DD)
   * @param end Fecha fin en formato ISO (YYYY-MM-DD)
   */
  getProgramaciones(start?: string, end?: string): Observable<Programacion[]> {
    // Si no se proporcionan fechas, usar el mes actual completo
    if (!start || !end) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      start = firstDay.toISOString().split('T')[0]; // YYYY-MM-DD
      end = lastDay.toISOString().split('T')[0];
    }

    let params = new HttpParams();
    params = params.set('start', start);
    params = params.set('end', end);

    return this.http.get<ProgramacionAPI[]>(this.apiUrl, { 
      headers: this.getHeaders(),
      params 
    }).pipe(
      map(response => {
        console.log('API Response:', response);
        // Convertir formato API a formato interno
        if (!Array.isArray(response)) return [];
        
        return response.map(apiProg => this.convertAPIToProgramacion(apiProg));
      }),
      catchError(error => {
        console.error('Error fetching programaciones:', error);
        console.error('Error details:', error.error);
        if (error.status === 401) {
          return throwError(() => new Error('No autorizado. Por favor inicie sesión nuevamente.'));
        }
        if (error.status === 400) {
          return throwError(() => new Error('Parámetros inválidos. Verifique las fechas.'));
        }
        return throwError(() => new Error('Error al cargar programaciones.'));
      })
    );
  }

  /**
   * Convertir formato API a formato interno
   */
  private convertAPIToProgramacion(apiProg: ProgramacionAPI): Programacion {
    return {
      programacion_id: apiProg.id,
      titulo: apiProg.title,
      fecha_inicio: apiProg.start,
      fecha_fin: apiProg.end,
      trabajador_id: apiProg.extendedProps.trabajador_id,
      cliente_id: apiProg.extendedProps.cliente_id,
      ascensor_id: apiProg.extendedProps.ascensor_id,
      tipo_trabajo: apiProg.extendedProps.tipo_trabajo,
      estado: apiProg.extendedProps.estado,
      descripcion: apiProg.extendedProps.descripcion,
      trabajador: apiProg.extendedProps.trabajador,
      cliente: apiProg.extendedProps.cliente,
      ascensor: apiProg.extendedProps.ascensor
    };
  }

  /**
   * Obtener una programación por ID
   */
  getProgramacionById(id: number): Observable<Programacion> {
    return this.http.get<ApiResponse<Programacion>>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching programacion:', error);
        return throwError(() => new Error('Error al cargar la programación.'));
      })
    );
  }

  /**
   * Crear nueva programación
   */
  createProgramacion(data: CrearProgramacionDTO): Observable<Programacion> {
    return this.http.post<ApiResponse<Programacion>>(this.apiUrl, data, { 
      headers: this.getHeaders() 
    }).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error creating programacion:', error);
        const message = error.error?.message || 'Error al crear la programación.';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Actualizar programación existente
   */
  updateProgramacion(id: number, data: ActualizarProgramacionDTO): Observable<Programacion> {
    return this.http.put<ApiResponse<Programacion>>(`${this.apiUrl}/${id}`, data, { 
      headers: this.getHeaders() 
    }).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error updating programacion:', error);
        const message = error.error?.message || 'Error al actualizar la programación.';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Eliminar programación
   */
  deleteProgramacion(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting programacion:', error);
        return throwError(() => new Error('Error al eliminar la programación.'));
      })
    );
  }

  /**
   * Helpers para formateo de fechas
   */
  
  // Combinar fecha y hora para crear ISO string
  combinarFechaHora(fecha: string, hora: string): string {
    // fecha: "2026-02-20", hora: "08:00"
    return `${fecha}T${hora}:00`;
  }

  // Extraer fecha de ISO string
  extraerFecha(isoString: string): string {
    return new Date(isoString).toLocaleDateString('es-ES');
  }

  // Extraer hora de ISO string
  extraerHora(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Obtener label para tipo de trabajo
  getTipoTrabajoLabel(tipo: TipoTrabajo): string {
    const labels: Record<TipoTrabajo, string> = {
      'mantenimiento': 'Mantenimiento',
      'reparacion': 'Reparación',
      'inspeccion': 'Inspección',
      'emergencia': 'Emergencia'
    };
    return labels[tipo] || tipo;
  }

  // Obtener color para tipo de trabajo
  getTipoTrabajoColor(tipo: TipoTrabajo): string {
    const colors: Record<TipoTrabajo, string> = {
      'mantenimiento': 'bg-blue-100 text-blue-700',
      'reparacion': 'bg-orange-100 text-orange-700',
      'inspeccion': 'bg-green-100 text-green-700',
      'emergencia': 'bg-red-100 text-red-700'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700';
  }

  // Obtener color para estado
  getEstadoColor(estado: EstadoProgramacion): string {
    const colors: Record<EstadoProgramacion, string> = {
      'pendiente': 'bg-yellow-100 text-yellow-700',
      'en_progreso': 'bg-blue-100 text-blue-700',
      'completada': 'bg-green-100 text-green-700',
      'cancelada': 'bg-red-100 text-red-700'
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  }
}
