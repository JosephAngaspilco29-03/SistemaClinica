/** Modelo completo de paciente (espejo de PacienteDto del backend) */
export interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  documentoIdentidad: string;
  fechaNacimiento: string; // ISO date string
  sexo: string;
  telefono: string;
  email: string;
  direccion: string;
  activo: boolean;
}

/** Payload para crear un nuevo paciente (espejo de CrearPacienteDto) */
export interface CrearPacienteRequest {
  nombres: string;
  apellidos: string;
  documentoIdentidad: string;
  fechaNacimiento: string; // ISO date string (yyyy-MM-dd)
  sexo: string;
  telefono: string;
  email: string;
  direccion: string;
}

/** Payload para actualizar un paciente existente (espejo de ActualizarPacienteDto) */
export interface ActualizarPacienteRequest {
  nombres: string;
  apellidos: string;
  fechaNacimiento: string; // ISO date string (yyyy-MM-dd)
  sexo: string;
  telefono: string;
  email: string;
  direccion: string;
  activo: boolean;
}
