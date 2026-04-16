import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { MantenimientoFijo, CrearMantenimientoFijoDTO } from '../models/mantenimiento.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MantenimientoFijoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/mantenimientos-fijos`;

  listar(ascensor_id?: number): Observable<MantenimientoFijo[]> {
    let params = new HttpParams();
    if (ascensor_id) params = params.set('ascensor_id', ascensor_id.toString());

    return this.http.get<MantenimientoFijo[]>(this.apiUrl, { params });
  }

  crear(data: CrearMantenimientoFijoDTO): Observable<any> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      catchError(error => {
        const message = error.error?.message || 'Error al crear el mantenimiento fijo.';
        return throwError(() => new Error(message));
      })
    );
  }

  actualizar(id: number, data: Partial<MantenimientoFijo>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(error => {
        const message = error.error?.message || 'Error al actualizar el mantenimiento fijo.';
        return throwError(() => new Error(message));
      })
    );
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        const message = error.error?.message || 'Error al eliminar el mantenimiento fijo.';
        return throwError(() => new Error(message));
      })
    );
  }
}
