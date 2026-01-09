export interface User {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: 'ADMIN' | 'TECNICO' | 'CLIENTE';
  tipo: 'administrador' | 'trabajador' | 'cliente';
}

export interface LoginRequest {
  dni: string;
  contrasena: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

