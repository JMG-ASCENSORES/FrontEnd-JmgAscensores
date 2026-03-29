import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SystemSetting {
  config_id: number;
  clave: string;
  valor: string;
  descripcion: string;
  tipo_dato: string;
  fecha_actualizacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/configuracion`;

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/perfil`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/perfil`, data);
  }

  getSystemSettings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/sistema`);
  }

  updateSystemSetting(clave: string, valor: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/sistema/${clave}`, { valor });
  }
}
