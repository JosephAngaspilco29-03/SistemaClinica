export interface Cita {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  medicoId: number;
  medicoNombre: string;
  especialidadId: number;
  especialidadNombre: string;
  horarioMedicoId: number;
  fechaHora: string;
  motivoConsulta: string;
  estado: string;
  fechaRegistro: string;
}

export interface CrearCitaDto {
  pacienteId: number;
  medicoId: number;
  especialidadId: number;
  horarioMedicoId: number;
  motivoConsulta: string;
}

export interface ReprogramarCitaDto {
  horarioMedicoId: number;
}
