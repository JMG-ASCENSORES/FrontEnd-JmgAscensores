import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Technician {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  edad: number;
  correo: string;
  telefono: string;
  especialidad: string;
  foto?: string;
  estado_activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TechnicianService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  getTechnicians(filters?: { especialidad?: string; estado_activo?: boolean }): Observable<Technician[]> {
    let params = new HttpParams();
    
    if (filters?.especialidad) {
      params = params.set('especialidad', filters.especialidad);
    }
    
    if (filters?.estado_activo !== undefined) {
      params = params.set('estado_activo', filters.estado_activo);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        // Assuming the response structure is { success: true, data: [...], message: ... }
        // and the data item keys match the DB model: trabajador_id, foto_perfil, etc.
        const items = response.data || [];
        return items.map((item: any) => ({
          id: item.trabajador_id,
          nombre: item.nombre,
          apellido: item.apellido,
          dni: item.dni,
          edad: item.edad,
          correo: item.correo,
          telefono: item.telefono,
          especialidad: item.especialidad,
          foto: item.foto_perfil,
          estado_activo: item.estado_activo,
          createdAt: item.fecha_creacion,
          updatedAt: item.fecha_actualizacion
        }));
      })
    );
  }

  createTechnician(data: any): Observable<Technician> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      map(response => response.data)
    );
  }

  updateTechnician(id: number, data: any): Observable<Technician> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      map(response => response.data)
    );
  }

  deleteTechnician(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
