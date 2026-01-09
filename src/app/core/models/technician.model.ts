

export interface RouteDetail {
  detalle_ruta_id: number;
  ruta_id: number;
  orden_parada: number;
  cliente_id: number;
  ascensor_id: number;
  hora_llegada?: string; // Time string HH:mm:ss
  hora_salida?: string;
  ubicacion_gps_llegada?: string;
  ubicacion_gps_salida?: string;
}

export interface DailyRoute {
  ruta_id: number;
  trabajador_id: number;
  fecha_ruta: string;
  numero_paradas: number;
  hora_inicio?: string;
  hora_fin?: string;
  estado_ruta: string;
  detalles?: RouteDetail[];
  fecha_creacion: string;
}

export interface Assignment {
  asignacion_id: number;
  trabajador_id: number;
  admin_id: number;
  cliente_id: number;
  fecha_asignacion: string;
  fecha_inicio_asignacion: string;
  fecha_fin_asignacion: string;
  estado_asignacion: string;
}
