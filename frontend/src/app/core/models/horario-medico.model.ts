export interface HorarioMedico {
  id: number;
  medicoId: number;
  medicoNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cuposDisponibles: number;
  activo: boolean;
  tieneCitas: boolean;
}

export interface CrearHorarioMedicoDto {
  medicoId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cuposDisponibles: number;
}

export interface ActualizarHorarioMedicoDto {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cuposDisponibles: number;
  activo: boolean;
}

export interface CrearMiHorarioDto {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cuposDisponibles: number;
}

export interface ActualizarMiHorarioDto {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cuposDisponibles: number;
  activo: boolean;
}
