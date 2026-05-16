// ============= Tipos =============

export type SchedulerState =
  | 'idle'
  | 'loading'
  | 'propuesta_lista'
  | 'adjusting'
  | 'confirming'
  | 'confirmado';

export type OrigenPropuesta = 'motor' | 'llm' | 'motor_fallback';

export type FuenteTrabajo = 'mantenimiento_fijo' | 'programacion_pendiente';

// ============= Demanda =============

export interface DemandInfo {
  fecha: string;
  total: number;
  por_tipo: {
    mantenimiento: number;
    reparacion: number;
    inspeccion: number;
    emergencia: number;
  };
}

export interface WorkItem {
  mantenimiento_fijo_id: number | null;
  programacion_id: number | null;
  fuente: FuenteTrabajo;
  cliente_id: number;
  nombre_cliente: string;
  distrito: string;
  tipo_trabajo: string;
  hora_preferida: string | null;
  tecnico_preferido_id: number | null;
  ascensor_id: number;
  tipo_equipo: string;
}

export interface DemandResponse {
  fecha: string;
  total: number;
  por_tipo: {
    mantenimiento: number;
    reparacion: number;
    inspeccion: number;
    emergencia: number;
  };
  trabajos: WorkItem[];
}

// ============= Técnicos =============

export interface CargaPreexistente {
  trabajos_confirmados: number;
  minutos_comprometidos: number;
  ultima_hora_fin: string | null;
}

export interface TecnicoConCarga {
  trabajador_id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  carga_preexistente: CargaPreexistente;
}

export interface TecnicosResponse {
  fecha: string;
  tecnicos: TecnicoConCarga[];
}

// ============= Propuesta =============

export interface TrabajoEnRuta {
  programacion_id: number | null;
  mantenimiento_fijo_id: number | null;
  fuente: FuenteTrabajo;
  cliente_id: number;
  nombre_cliente: string;
  distrito: string;
  ascensor_id: number;
  tipo_equipo: string;
  tipo_trabajo: string;
  duracion_min: number;
  hora_inicio: string;
  hora_fin: string;
  traslado_desde_anterior: number;
  tecnico_preferido_respetado: boolean;
  overflow: boolean;
  justificacion: string | null;
}

export interface TecnicoPropuesta {
  trabajador_id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  carga_minutos: number;
  carga_horas: number;
  trabajos: TrabajoEnRuta[];
}

export interface TrabajoOverflow {
  programacion_id: number | null;
  nombre_cliente: string;
  distrito: string;
  tipo_trabajo: string;
  duracion_min: number;
  trabajador_id_propuesto: number;
  razon_overflow: string;
  overflow: boolean;
  justificacion: string | null;
}

export interface Propuesta {
  fecha: string;
  generado_en: string;
  origen: OrigenPropuesta;
  llm_model?: string;
  version?: string;
  tecnicos: TecnicoPropuesta[];
  overflow: TrabajoOverflow[];
  sin_elegible: TrabajoEnRuta[];
  notas_overflow?: string;
  advertencias?: string[];
}

// ============= Requests =============

export interface GenerarRequest {
  fecha: string;
  tecnico_ids: number[];
  instruccion_admin?: string | null;
}

export interface AjustarRequest {
  propuesta_actual: Propuesta;
  instruccion: string;
}

export interface ConfirmarRequest {
  fecha: string;
  propuesta: Propuesta;
}

export interface ConfirmarResponse {
  ok: boolean;
  programaciones_creadas: number;
  programaciones_actualizadas: number;
  rutas_generadas: number;
}

// ============= Configuración =============

export interface ConfigItem {
  tipo_trabajo: string;
  duracion_min: number;
  tecnicos_requeridos: number;
  prioridad: number;
}

export interface VentanaHoraria {
  hora_inicio: string;
  hora_fin_limite: string;
}

export interface ConfigResponse {
  config: ConfigItem[];
  ventana_horaria: VentanaHoraria;
}

export interface UpdateConfigRequest {
  tipo_trabajo: string;
  duracion_min?: number;
  tecnicos_requeridos?: number;
  prioridad?: number;
}

export interface UpdateConfigResponse {
  ok: boolean;
  actualizado: {
    tipo_trabajo: string;
    duracion_min?: number;
    tecnicos_requeridos?: number;
    prioridad?: number;
  };
}
