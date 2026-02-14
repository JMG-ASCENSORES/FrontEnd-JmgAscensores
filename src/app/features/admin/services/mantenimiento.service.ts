import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mantenimiento, CrearMantenimientoDTO } from '../models/mantenimiento.interface';

@Injectable({
  providedIn: 'root'
})
export class MantenimientoService {
  private apiUrl = 'http://localhost:3000/api/mantenimientos';

  constructor(private http: HttpClient) {}

  // Listar (para calendario o tabla)
  listar(start?: string, end?: string): Observable<Mantenimiento[]> {
    const params: any = {};
    // Si no se proporcionan fechas, usar un rango amplio para traer "todo" (2024-2030)
    // Esto asegura que el backend devuelva el formato de eventos (fullcalendar)
    if (!start || !end) {
      start = '2020-01-01';
      end = '2030-12-31';
    }
    
    if (start) params.start = start;
    if (end) params.end = end;
    
    return this.http.get<Mantenimiento[]>(this.apiUrl, { params });
  }

  // Crear
  crear(data: CrearMantenimientoDTO): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Actualizar
  actualizar(id: number, data: Partial<CrearMantenimientoDTO>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // Eliminar
  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
