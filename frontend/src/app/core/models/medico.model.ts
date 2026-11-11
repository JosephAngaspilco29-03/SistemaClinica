export interface EspecialidadMedico {
  id: number;
  nombre: string;
}

export interface CrearMedicoDto {
  nombres: string;
  apellidos: string;
  numeroColegiatura: string;
  telefono: string;
  email: string;
  especialidadIds: number[];
}

export interface ActualizarMedicoDto extends CrearMedicoDto {
  activo: boolean;
}

export interface Medico {
  id: number;
  nombres: string;
  apellidos: string;
  numeroColegiatura: string;
  telefono: string;
  email: string;
  activo: boolean;
  especialidades: EspecialidadMedico[];
}
