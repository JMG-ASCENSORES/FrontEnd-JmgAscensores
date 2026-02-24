export interface Mantenimiento {
  id: number;
  title: string;
  start: string; // ISO Date String
  end: string;   // ISO Date String
  color: string;
  extendedProps: {
    cliente_id?: number;
    ascensor_id?: number;
    trabajador_id?: number;
    tipo_trabajo?: 'mantenimiento' | 'reparacion' | 'inspeccion' | 'emergencia';
    estado?: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
    descripcion?: string;
    // Agrego estos campos opcionales para facilitar el acceso en el template si vienen populados
    cliente?: any;
    ascensor?: any;
    trabajador?: any;
  };
}

export interface CrearMantenimientoDTO {
  titulo: string;
  fecha_programada?: string;     // 'YYYY-MM-DD'
  hora_estimada_inicio?: string; // 'HH:mm'
  hora_estimada_fin?: string;    // 'HH:mm'
  cliente_id?: number;
  ascensor_id?: number;
  trabajador_id?: number;
  tipo_trabajo?: string;
  color?: string;
  descripcion?: string;
  observaciones?: string;
}
