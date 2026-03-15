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
  capacidad: string;
  piso_cantidad: number;
  fecha_ultimo_mantenimiento: string;
  estado: string;
  observaciones: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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
