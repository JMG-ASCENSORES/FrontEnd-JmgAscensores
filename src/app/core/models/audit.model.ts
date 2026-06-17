export interface AuditActor {
  id: number;
  tipo: 'administrador' | 'trabajador';
  nombre_completo: string;
}
