export interface Client {
  cliente_id: number;
  tipo_cliente: string;
  nombre_comercial?: string;
  codigo: string;
  ubicacion: string;
  ciudad: string;
  distrito: string;
  telefono: string;
  contacto_correo: string;
  contacto_nombre: string;
  contacto_apellido: string;
  contacto_telefono: string;
  estado_activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion?: string;
}
