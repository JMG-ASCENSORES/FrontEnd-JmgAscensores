export interface ClienteResumen {
  cliente_id: number;
  nombre_comercial?: string;
  tipo_cliente?: string;
  contacto_nombre?: string;
  contacto_apellido?: string;
  contacto_telefono?: string;
  telefono?: string;
  distrito?: string;
  ubicacion?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
}

export interface AscensorResumen {
  ascensor_id: number;
  tipo_equipo?: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
}

export interface TrabajadorResumen {
  trabajador_id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  telefono?: string;
}

export interface TechnicianNotification {
  tech: TrabajadorResumen;
  services: Mantenimiento[];
}

export interface ClientNotification {
  client: ClienteResumen;
  services: Mantenimiento[];
}

export interface Mantenimiento {
  id: number;
  title: string;
  start: string;
  end: string;
  color: string;
  extendedProps: {
    cliente_id?: number;
    ascensor_id?: number;
    trabajador_id?: number;        // técnico 1 (legacy)
    tecnico2_id?: number;          // técnico 2
    tecnico3_id?: number;          // técnico 3
    tecnico4_id?: number;          // técnico 4
    trabajador_ids?: number[];     // array de hasta 4 IDs (calculado por backend)
    tipo_trabajo?: 'mantenimiento' | 'reparacion' | 'inspeccion' | 'emergencia';
    estado?: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
    descripcion?: string;
    cliente?: ClienteResumen;
    ascensor?: AscensorResumen;
    trabajador?: TrabajadorResumen;
    trabajadores?: TrabajadorResumen[];
    orden_id?: number;
    informe_id?: number;
    mantenimiento_fijo_id?: number;
  };
}

export interface MantenimientoFijo {
  mantenimiento_fijo_id: number;
  ascensor_id: number;
  trabajador_id?: number;
  dia_mes: number;
  hora: string;
  frecuencia: 'mensual' | 'bimestral' | 'trimestral';
  activo: boolean;
  ascensor?: AscensorResumen;
}

export interface CrearMantenimientoFijoDTO {
  ascensor_id: number;
  trabajador_id?: number;
  dia_mes: number;
  hora: string;
  frecuencia: 'mensual' | 'bimestral' | 'trimestral';
}

export interface CrearMantenimientoDTO {
  titulo: string;
  fecha_programada?: string;      // 'YYYY-MM-DD'
  hora_estimada_inicio?: string;  // 'HH:mm'
  hora_estimada_fin?: string;     // 'HH:mm'
  cliente_id?: number;
  ascensor_id?: number;
  trabajador_id?: number;         // legacy
  trabajador_ids?: number[];      // nuevo: array de hasta 4 IDs
  tipo_trabajo?: string;
  color?: string;
  descripcion?: string;
  observaciones?: string;
}
