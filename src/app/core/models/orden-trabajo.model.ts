export interface TareaMaestra {
  tarea_maestra_id: number;
  tipo_equipo: string;
  descripcion_tarea: string;
  categoria?: string;
  activa: boolean;
  fecha_creacion: string;
  fecha_actualizacion?: string;
}

export interface DetalleOrden {
  detalle_id: number;
  orden_id: number;
  tarea_maestra_id?: number;
  realizado: boolean;
  accion_realizada?: string;
  TareaMaestra?: TareaMaestra;
}

export interface OrdenTrabajo {
  orden_id: number;
  programacion_id: number;
  cliente_id: number;
  ascensor_id?: number;
  hora_inicio?: string;
  hora_fin?: string;
  estado: 'en_progreso' | 'completado' | 'cancelado';
  observaciones_generales?: string;
  fecha_creacion: string;
  fecha_actualizacion?: string;
  DetallesOrden?: DetalleOrden[];
  Programacion?: any; // You can import Programacion model if you have it
  Cliente?: any;
  Ascensor?: any;
}
