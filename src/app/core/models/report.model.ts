export interface Evidence {
  evidencia_id: number;
  informe_id: number;
  tipo_evidencia: string;
  url_archivo: string;
  nombre_archivo: string;
  descripcion: string;
  fecha_carga: string;
}

export interface DetalleOrden {
  detalle_id: number;
  orden_id: number;
  tarea_maestra_id?: number;
  realizado: boolean;
  accion_realizada?: string;
  TareaMaestra?: {
    descripcion_tarea: string;
    categoria: string;
  };
}

export interface WorkOrder {
  orden_id: number;
  programacion_id: number;
  cliente_id: number;
  ascensor_id: number;
  estado: string;
  detalles?: DetalleOrden[];
}

export interface Report {
  informe_id: number;
  orden_id: number;
  trabajador_id: number;
  cliente_id: number;
  ascensor_id: number;
  tipo_informe: string;
  descripcion_trabajo: string;
  observaciones?: string;
  ubicacion_envio?: string;
  fecha_informe: string;
  hora_informe: string;
  firma_tecnico_id?: number;
  firma_cliente_id?: number;
  url_documento?: string; // Generated PDF
  fecha_creacion: string;
  fecha_actualizacion?: string;
  evidencias?: Evidence[];
  Cliente?: any;
  Trabajador?: any;
  OrdenTrabajo?: WorkOrder;
}

