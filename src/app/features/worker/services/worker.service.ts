import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface WorkerProfile {
  trabajador_id: number;
  dni: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  especialidad?: string;
  foto_perfil?: string;
  edad?: number;
  estado_activo?: boolean;
  fecha_creacion?: string;
}

export interface UpdateProfilePayload {
  nombre?: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
  contrasena_hash?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /** Obtiene el perfil del trabajador autenticado */
  getMyProfile(): Observable<WorkerProfile> {
    return this.http
      .get<{ success: boolean; data: WorkerProfile }>(
        `${this.apiUrl}/usuarios/me`,
        { headers: this.getHeaders() }
      )
      .pipe(map(res => res.data));
  }

  /** Actualiza el perfil propio del trabajador */
  updateMyProfile(payload: UpdateProfilePayload): Observable<WorkerProfile> {
    return this.http
      .put<{ success: boolean; data: WorkerProfile }>(
        `${this.apiUrl}/usuarios/me`,
        payload,
        { headers: this.getHeaders() }
      )
      .pipe(map(res => res.data));
  }
}
