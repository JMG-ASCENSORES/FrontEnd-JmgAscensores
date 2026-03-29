import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { MantenimientoFijo, CrearMantenimientoFijoDTO } from '../models/mantenimiento.interface';

@Injectable({
  providedIn: 'root'
})
export class MantenimientoFijoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/mantenimientos-fijos';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  listar(ascensor_id?: number): Observable<MantenimientoFijo[]> {
    let params = new HttpParams();
    if (ascensor_id) params = params.set('ascensor_id', ascensor_id.toString());

    return this.http.get<MantenimientoFijo[]>(this.apiUrl, { 
      headers: this.getHeaders(),
      params
    });
  }

  crear(data: CrearMantenimientoFijoDTO): Observable<any> {
    return this.http.post<any>(this.apiUrl, data, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        const message = error.error?.message || 'Error al crear el mantenimiento fijo.';
        return throwError(() => new Error(message));
      })
    );
  }

  actualizar(id: number, data: Partial<MantenimientoFijo>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        const message = error.error?.message || 'Error al actualizar el mantenimiento fijo.';
        return throwError(() => new Error(message));
      })
    );
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        const message = error.error?.message || 'Error al eliminar el mantenimiento fijo.';
        return throwError(() => new Error(message));
      })
    );
  }
}
