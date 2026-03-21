import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
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

  private getHeaders(): HttpHeaders {
    // Basic standard approach, or use an interceptor if configured globally.
    // Adding here as per explicit user request.
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

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

    return this.http.get<any>(this.apiUrl, { params, headers: this.getHeaders() }).pipe(
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
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(response => response.data)
    );
  }

  createReport(data: any): Observable<Report> {
    return this.http.post<any>(this.apiUrl, data, { headers: this.getHeaders() }).pipe(
      map(response => response.data)
    );
  }

  updateReport(id: number, data: any): Observable<Report> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() }).pipe(
      map(response => response.data)
    );
  }

  deleteReport(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  downloadReportPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
}
