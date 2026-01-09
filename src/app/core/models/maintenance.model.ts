export interface Task {
  tarea_id: number;
  mantenimiento_id: number;
  nombre_tarea: string;
  descripcion_tarea: string;
  tipo_tarea: string;
  estado: string;
}

export interface Maintenance {
  mantenimiento_id: number;
  cliente_id: number;
  ascensor_id: number;
  fecha_programada: string;
  hora_estimada_inicio: string;
  hora_estimada_fin: string;
  tareas_designadas: string;
  estado: 'programado' | 'en_proceso' | 'finalizado' | 'cancelado';
  observaciones?: string;
  fecha_creacion: string;
  tareas?: Task[];
}
