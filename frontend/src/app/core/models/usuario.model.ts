/** Datos para crear una cuenta de personal desde Administración (POST /api/Auth/usuarios). */
export interface CrearUsuarioDto {
  nombreUsuario: string;
  password: string;
  rol: 'Medico' | 'Enfermero';
  medicoId: number | null;
}

/** Usuario del sistema tal como lo devuelve GET /api/Auth/usuarios (no incluye contraseña). */
export interface UsuarioListado {
  id: number;
  nombreUsuario: string;
  rol: string;
  activo: boolean;
  pacienteId: number | null;
  medicoId: number | null;
}

