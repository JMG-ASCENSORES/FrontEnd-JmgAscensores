export interface Evidence {
  evidencia_id: number;
  informe_id: number;
  tipo_evidencia: string;
  url_archivo: string;
  nombre_archivo: string;
  descripcion: string;
  fecha_carga: string;
}

export interface Report {
  informe_id: number;
  asignacion_id: number;
  trabajador_id: number;
  cliente_id: number;
  ascensor_id: number;
  tipo_informe: string;
  descripcion_trabajo: string;
  observaciones?: string;
  ubicacion_envio?: string;
  fecha_informe: string;
  hora_informe: string;
  firma_tecnico?: string; // URL or Base64
  firma_cliente?: string;
  url_documento?: string; // Generated PDF
  fecha_creacion: string;
  evidencias?: Evidence[];
  Cliente?: any;
  Trabajador?: any;
}
