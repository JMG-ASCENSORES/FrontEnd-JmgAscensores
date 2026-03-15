import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
        descripcion:   m.descripcion || m.observaciones || '', // Aseguro que haya string
        trabajador:    m.extendedProps?.trabajador || m.Trabajador || null,
        trabajadores:  m.extendedProps?.trabajadores || m.trabajadores || null,
        cliente:       m.extendedProps?.cliente || m.Cliente || null,
        ascensor:      m.extendedProps?.ascensor || m.Ascensor || null
      }
    };
  }

  // ─── Listar todos ─────────────────────────────────────────────────────────────
  listar(start?: string, end?: string, trabajadorId?: number, detailed: boolean = false): Observable<Mantenimiento[]> {
    let params = new HttpParams();
    if (start) params = params.set('start', start);
    if (end) params = params.set('end', end);
    if (trabajadorId) params = params.set('trabajador_id', trabajadorId.toString());
    if (detailed) params = params.set('detailed', 'true');

    return this.http.get<any>(this.apiUrl, { 
      headers: this.getHeaders(),
      params 
    }).pipe(
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

  // ─── Obtener por ID ───────────────────────────────────────────────────────────
  getById(id: number): Observable<Mantenimiento | null> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        map(response => {
           if (response && response.data) {
              return this.mapToMantenimiento(response.data);
           }
           return null;
        }),
        catchError(err => {
          console.error(`Error obteniendo programación ${id}:`, err);
          return of(null);
        })
      );
  }

  // ─── Helper: convierte fecha + horas al formato start/end que espera /api/programaciones ───
  private buildStartEnd(data: Partial<CrearMantenimientoDTO>): { start: string; end: string } {
    const fecha = data.fecha_programada || new Date().toISOString().split('T')[0];
    const hi    = (data.hora_estimada_inicio || '08:00').substring(0, 5);
    const hf    = (data.hora_estimada_fin    || '09:00').substring(0, 5);
    return {
      start: `${fecha}T${hi}:00`,
      end:   `${fecha}T${hf}:00`
    };
  }

  // ─── Crear ────────────────────────────────────────────────────────────────────
  crear(data: CrearMantenimientoDTO): Observable<any> {
    const { start, end } = this.buildStartEnd(data);
    const payload = {
      titulo:         data.titulo,
      start,
      end,
      tipo_trabajo:   data.tipo_trabajo  || 'mantenimiento',
      descripcion:    data.descripcion   || null,
      color:          data.color         || '#3788d8',
      trabajador_ids: (data.trabajador_ids || []).filter(id => id && id !== 0),
      cliente_id:     (!data.cliente_id    || data.cliente_id    === 0) ? null : data.cliente_id,
      ascensor_id:    (!data.ascensor_id   || data.ascensor_id   === 0) ? null : data.ascensor_id,
    };
    return this.http.post(this.apiUrl, payload, { headers: this.getHeaders() });
  }

  // ─── Actualizar ──────────────────────────────────────────────────────────────
  actualizar(id: number, data: Partial<CrearMantenimientoDTO>): Observable<any> {
    const { start, end } = this.buildStartEnd(data);
    const payload = {
      titulo:         data.titulo,
      start,
      end,
      tipo_trabajo:   data.tipo_trabajo  || 'mantenimiento',
      descripcion:    data.descripcion   || null,
      color:          data.color         || '#3788d8',
      trabajador_ids: (data.trabajador_ids || []).filter(id => id && id !== 0),
      cliente_id:     (!data.cliente_id    || data.cliente_id    === 0) ? null : data.cliente_id,
      ascensor_id:    (!data.ascensor_id   || data.ascensor_id   === 0) ? null : data.ascensor_id,
    };
    return this.http.put(`${this.apiUrl}/${id}`, payload, { headers: this.getHeaders() });
  }

  // ─── Eliminar ─────────────────────────────────────────────────────────────────
  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
