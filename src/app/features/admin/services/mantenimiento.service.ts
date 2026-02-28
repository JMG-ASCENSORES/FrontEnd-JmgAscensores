import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Mantenimiento, CrearMantenimientoDTO } from '../models/mantenimiento.interface';

interface ApiResponse {
  success: boolean;
  data: any[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MantenimientoService {
  private apiUrl = 'http://localhost:3000/api/programaciones';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Mapea respuesta del backend al interface Mantenimiento.
   * /api/programaciones retorna ya {id, title, start, end, color, extendedProps}
   * /api/mantenimientos retorna {mantenimiento_id, fecha_programada, hora_estimada_*}
   */
  private mapToMantenimiento(m: any): Mantenimiento {
    // Si ya tiene 'id', 'title', 'start' (formato FullCalendar directo de /api/programaciones)
    if (m.id !== undefined && m.title !== undefined && m.start !== undefined) {
      return m as Mantenimiento;
    }

    // Si viene en formato raw Mantenimiento (mantenimiento_id, fecha_programada, etc.)
    const fechaBase = m.fecha_programada
      ? (typeof m.fecha_programada === 'string'
          ? m.fecha_programada.split('T')[0]
          : new Date(m.fecha_programada).toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0];

    const horaInicio = (m.hora_estimada_inicio || '08:00:00').substring(0, 5);
    const horaFin    = (m.hora_estimada_fin    || '09:00:00').substring(0, 5);

    return {
      id:    m.mantenimiento_id ?? m.programacion_id ?? m.id,
      title: m.titulo || m.observaciones || `Mantenimiento #${m.mantenimiento_id || m.id}`,
      start: `${fechaBase}T${horaInicio}:00`,
      end:   `${fechaBase}T${horaFin}:00`,
      color: m.color || '#3788d8',
      extendedProps: {
        trabajador_id: m.trabajador_id,
        cliente_id:    m.cliente_id,
        ascensor_id:   m.ascensor_id,
        tipo_trabajo:  m.tipo_trabajo,
        estado:        m.estado,
        descripcion:   m.descripcion || m.observaciones,
        trabajador:    m.Trabajador || null,
        cliente:       m.Cliente    || null,
        ascensor:      m.Ascensor   || null
      }
    };
  }

  // ─── Listar todos ─────────────────────────────────────────────────────────────
  listar(): Observable<Mantenimiento[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => {
        const raw: any[] = Array.isArray(response)
          ? response
          : (response?.data ?? []);
        return raw.map((m: any) => this.mapToMantenimiento(m));
      }),
      catchError(err => {
        console.error('Error listando programaciones:', err);
        return of([]);
      })
    );
  }

  // ─── Crear ───────────────────────────────────────────────────────────────────
  crear(data: CrearMantenimientoDTO): Observable<any> {
    // Convertir 0 → null para campos FK (PostgreSQL no acepta 0 como FK)
    const payload = {
      ...data,
      cliente_id:    (!data.cliente_id    || data.cliente_id    === 0) ? null : data.cliente_id,
      ascensor_id:   (!data.ascensor_id   || data.ascensor_id   === 0) ? null : data.ascensor_id,
      trabajador_id: (!data.trabajador_id || data.trabajador_id === 0) ? null : data.trabajador_id,
    };
    return this.http.post(this.apiUrl, payload, { headers: this.getHeaders() });
  }

  // ─── Actualizar ──────────────────────────────────────────────────────────────
  actualizar(id: number, data: Partial<CrearMantenimientoDTO>): Observable<any> {
    const payload = {
      ...data,
      cliente_id:    (!data.cliente_id    || data.cliente_id    === 0) ? null : data.cliente_id,
      ascensor_id:   (!data.ascensor_id   || data.ascensor_id   === 0) ? null : data.ascensor_id,
      trabajador_id: (!data.trabajador_id || data.trabajador_id === 0) ? null : data.trabajador_id,
    };
    return this.http.put(`${this.apiUrl}/${id}`, payload, { headers: this.getHeaders() });
  }

  // ─── Eliminar ─────────────────────────────────────────────────────────────────
  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
