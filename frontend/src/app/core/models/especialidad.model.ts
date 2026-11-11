export interface CrearEspecialidadDto {
  nombre: string;
  descripcion: string;
}

export interface ActualizarEspecialidadDto extends CrearEspecialidadDto {
  activo: boolean;
}

export interface Especialidad {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}
