import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  firma_defecto_id?: number;
  FirmaPredeterminada?: {
    firma_id: number;
    base64_data: string;
  };
}

export interface UpdateProfilePayload {
  nombre?: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
  contrasena_hash?: string;
  firma_defecto_base64?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /** Obtiene el perfil del trabajador autenticado */
  getMyProfile(): Observable<WorkerProfile> {
    return this.http
      .get<{ success: boolean; data: WorkerProfile }>(`${this.apiUrl}/usuarios/me`)
      .pipe(map(res => res.data));
  }

  /** Actualiza el perfil propio del trabajador */
  updateMyProfile(payload: UpdateProfilePayload): Observable<WorkerProfile> {
    return this.http
      .put<{ success: boolean; data: WorkerProfile }>(`${this.apiUrl}/usuarios/me`, payload)
      .pipe(map(res => res.data));
  }
}
