// ============= Tipos base =============

export type SchedulerState =
  | 'idle'
  | 'loading'
  | 'sugerencia_lista'
  | 'adjusting'
  | 'confirming'
  | 'confirmado';

export type OrigenPropuesta = 'motor' | 'llm' | 'motor_fallback';

export type TipoTrabajo = 'mantenimiento' | 'reparacion' | 'inspeccion' | 'emergencia';

// ============= Demanda (MantenimientosFijos vencidos — contexto informativo) =============

export interface MantenimientoVencido {
  mantenimiento_fijo_id: number;
  ascensor_id: number;
  cliente_id: number;
  nombre_cliente: string;
  distrito: string;
  tipo_equipo: string;
  tipo_trabajo: 'mantenimiento';
  hora_preferida: string | null;
}

export interface DemandResponse {
  fecha: string;
  total: number;
  trabajos: MantenimientoVencido[];
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

// ============= Trabajo enriquecido (devuelto por el backend) =============

export interface WorkItemEnriquecido {
  cliente_id: number;
  ascensor_id: number;
  nombre_cliente: string;
  distrito: string;
  tipo_equipo: string;
  marca?: string;
  tipo_trabajo: TipoTrabajo;
  duracion_min: number;
  hora_preferida: string | null;
}

// ============= Sugerencia =============

export interface SlotSugerido {
  trabajador_id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  hora_inicio: string;          // 'HH:MM'
  hora_fin: string;             // 'HH:MM'
  traslado_min: number;
  carga_previa_horas: number;
  justificacion: string | null;
}

export interface SugerenciaResponse {
  fecha: string;
  generado_en: string;
  origen: OrigenPropuesta;
  llm_model?: string;
  advertencias?: string[];
  trabajo: WorkItemEnriquecido;
  sugerencia: SlotSugerido | null;
  alternativas: SlotSugerido[];
  sin_elegible: boolean;
  razon_sin_elegible: string | null;
  notas_llm?: string | null;
}

// ============= Requests =============

export interface GenerarRequest {
  fecha: string;
  trabajo: {
    cliente_id: number;
    ascensor_id: number;
    tipo_trabajo: TipoTrabajo;
    hora_preferida?: string | null;
  };
  tecnico_ids: number[];
  instruccion_admin?: string | null;
}

export interface AjustarRequest {
  sugerencia_actual: SugerenciaResponse;
  instruccion: string;
}

export interface ConfirmarRequest {
  fecha: string;
  trabajo: {
    cliente_id: number;
    ascensor_id: number;
    tipo_trabajo: TipoTrabajo;
    nombre_cliente?: string;
    hora_inicio: string;
    hora_fin: string;
    justificacion?: string | null;
  };
  tecnico_id: number;
  mantenimiento_fijo_id?: number | null;
}

export interface ConfirmarResponse {
  ok: boolean;
  programacion_id: number;
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
