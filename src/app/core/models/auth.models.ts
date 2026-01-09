export interface Admin {
  admin_id: number;
  dni: string;
  nombre: string;
  apellido: string;
  correo: string;
  activo: boolean;
  fecha_creacion: string; // ISO Date
}

export interface Worker {
  trabajador_id: number;
  dni: string;
  nombre: string;
  apellido: string;
  edad: number;
  correo: string;
  telefono: string;
  especialidad: string;
  foto_perfil?: string;
  estado_activo: boolean;
  fecha_creacion: string;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
  rol: 'admin' | 'trabajador';
}

export interface AuthResponse {
  token: string;
  usuario: Admin | Worker;
  rol: 'admin' | 'trabajador';
}
