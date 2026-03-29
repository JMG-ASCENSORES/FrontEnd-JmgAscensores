import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ClienteResumen {
  cliente_id: number;
  codigo?: string;
  nombre_comercial?: string;
  contacto_nombre?: string;
  contacto_apellido?: string;
  contacto_telefono?: string;
  ubicacion?: string;
  ciudad?: string;
  distrito?: string;
  telefono?: string;
  tipo_cliente?: string;
  ruc?: string;
  dni?: string;
}

export interface EquipoCliente {
  ascensor_id: number;
  cliente_id: number;
  tipo_equipo: string;
  marca: string;
  modelo: string;
  numero_serie: string;
  capacidad_kg: number;
  capacidad_personas: number;
  piso_cantidad: number;
  fecha_ultimo_mantenimiento: string;
  estado: string;
  observaciones: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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
export class WorkerEquipmentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /** Obtiene la lista resumida de todos los clientes activos */
  getClientes(): Observable<ClienteResumen[]> {
    return this.http.get<ApiResponse<ClienteResumen[]>>(`${this.apiUrl}/clientes`, { headers: this.getHeaders() })
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching clientes:', error);
          return throwError(() => new Error('Error al cargar la lista de clientes.'));
        })
      );
  }

  /** Obtiene clientes paginados con búsqueda opcional */
  getClientesPaginated(page: number, limit: number, search?: string): Observable<ApiResponse<ClienteResumen[]>> {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString()
    };
    if (search) params['search'] = search;

    return this.http.get<ApiResponse<ClienteResumen[]>>(`${this.apiUrl}/clientes`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      catchError(error => {
        console.error('Error fetching paginated clientes:', error);
        return throwError(() => new Error('Error al cargar clientes.'));
      })
    );
  }

  /** Obtiene los equipos de un cliente dado su ID */
  getEquiposByCliente(clienteId: number): Observable<EquipoCliente[]> {
    return this.http.get<ApiResponse<EquipoCliente[]>>(`${this.apiUrl}/clientes/${clienteId}/ascensores`, { headers: this.getHeaders() })
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching equipos:', error);
          return of([]);
        })
      );
  }
}
