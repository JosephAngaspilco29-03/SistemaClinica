export interface User {
  id: number;
  nombreUsuario: string;
  rol: string;
  pacienteId?: number | null;
  medicoId?: number | null;
}

export interface LoginRequest {
  nombreUsuario: string;
  password: string;
}
