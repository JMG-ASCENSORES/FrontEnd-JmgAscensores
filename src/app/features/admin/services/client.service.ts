import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Client {
  cliente_id: number;
  tipo_cliente?: string; // e.g., 'corporativo', 'residencial'
  dni?: string;
  ruc?: string; // Keeping for compatibility if API adds it later
  ubicacion?: string;
  latitud?: number;
  longitud?: number;
  ciudad?: string;
  distrito?: string;
  telefono?: string;
  contacto_correo?: string;
  contacto_nombre?: string;
  contacto_apellido?: string;
  contacto_telefono?: string;
  estado_activo?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  nombre_comercial?: string; // Mapped from response or fallback

  // Equipment counts provided by the optimized backend API
  ascensores_count?: number;
  montacargas_count?: number;
  plataforma_count?: number;
}

export interface Elevator {
    ascensor_id: number;
    cliente_id: number;
    tipo_equipo: string;
    marca: string;
    modelo: string;
    numero_serie: string;
    estado: string;
    // Add other fields if needed for other views, but this is enough for counting
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: Client[];
  timestamp?: string;
  meta?: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface ElevatorApiResponse {
  success: boolean;
  message: string;
  data: Elevator[];
  timestamp?: string;
}

export interface ClientStatsResponse {
  success: boolean;
  message: string;
  data: {
    total_clientes: number;
    total_ascensores: number;
    total_montacargas: number;
    total_plataformas: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clientes`;
  private elevatorsUrl = `${environment.apiUrl}/ascensores`;

  getClients(params?: Record<string, string | number | boolean>): Observable<Client[]> {
    return this.http.get<ApiResponse>(this.apiUrl, { params })
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching clients:', error);
          if (error.status === 401) {
             return throwError(() => new Error('No autorizado. Por favor inicie sesión nuevamente.'));
          }
          return throwError(() => new Error('Error al cargar clientes.'));
        })
      );
  }

  getClientsPaginated(page: number, limit: number, search?: string): Observable<ApiResponse> {
    const params: Record<string, string> = { page: page.toString(), limit: limit.toString() };
    if (search) params['search'] = search;

    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

  getClientStats(): Observable<ClientStatsResponse> {
    return this.http.get<ClientStatsResponse>(`${this.apiUrl}/stats`);
  }

  getElevators(): Observable<Elevator[]> {
    return this.http.get<ElevatorApiResponse>(this.elevatorsUrl)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching elevators:', error);
          return of([]);
        })
      );
  }

  createClient(client: Partial<Client>): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.apiUrl, client);
  }

  updateClient(id: number, client: Partial<Client>): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}`, client);
  }

  deleteClient(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }
}
