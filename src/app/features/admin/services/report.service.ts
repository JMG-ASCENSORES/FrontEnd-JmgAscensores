import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Report } from '../../../core/models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/informes`;

  getReports(filters?: { 
    tipo_informe?: string; 
    cliente_id?: number | string; 
    fecha_inicio?: string; 
    fecha_fin?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<{ informes: Report[], meta: any }> {
    let params = new HttpParams();
    
    if (filters?.tipo_informe) {
      params = params.set('tipo_informe', filters.tipo_informe);
    }
    
    if (filters?.cliente_id) {
      params = params.set('cliente_id', filters.cliente_id);
    }

    if (filters?.fecha_inicio) {
        params = params.set('fecha_inicio', filters.fecha_inicio);
    }

    if (filters?.fecha_fin) {
        params = params.set('fecha_fin', filters.fecha_fin);
    }

    if (filters?.search) {
        params = params.set('search', filters.search);
    }
    if (filters?.page) {
        params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
        params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        // Adaptamos al nuevo envelope de paginación {data: { informes, meta }}
        if (response.data && response.data.informes) {
            return {
                informes: response.data.informes,
                meta: response.data.meta || {}
            };
        }
        // Fallbacks
        return { informes: response.data || [], meta: {} };
      })
    );
  }

  getReportById(id: number): Observable<Report> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createReport(data: any): Observable<Report> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      map(response => response.data)
    );
  }

  updateReport(id: number, data: any): Observable<Report> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      map(response => response.data)
    );
  }

  patchReport(id: number, delta: any): Observable<Report> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, delta).pipe(
      map(response => response.data)
    );
  }

  deleteReport(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  downloadReportPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  getWorkOrderById(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/ordenes-trabajo/${id}`).pipe(
      map(response => response.data)
    );
  }

  updateWorkOrder(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/ordenes-trabajo/${id}`, data).pipe(
      map(response => response.data)
    );
  }

  patchOrdenEstado(id: number, estado: string): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/ordenes-trabajo/${id}/estado`, { estado }).pipe(
      map(response => response.data)
    );
  }

  getStandardTasks(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/tareas-maestras`).pipe(
      map(response => response.data)
    );
  }
}

