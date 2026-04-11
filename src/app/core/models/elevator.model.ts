export interface Elevator {
  ascensor_id: number;
  cliente_id: number;
  tipo_equipo: string;
  marca?: string;
  modelo?: string;
  numero_serie: string;
  capacidad_kg?: number;
  capacidad_personas?: number;
  piso_cantidad?: number;
  fecha_ultimo_mantenimiento?: string;
  estado?: string;
  observaciones?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;

  // Transient/UI properties
  cliente_nombre?: string;
}
