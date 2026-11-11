export interface AtencionMedica {
  id: number;
  citaId: number;
  pacienteId: number;
  pacienteNombre: string;
  medicoId: number;
  medicoNombre: string;
  fechaAtencion: string;
  motivoConsulta: string;
  anamnesis: string;
  examenFisico: string;
  indicaciones: string;
  observaciones: string;
  diagnosticos: DiagnosticoDto[];
}

export interface DiagnosticoDto {
  id: number;
  codigoCie10: string;
  descripcion: string;
  principal: boolean;
}

export interface CrearDiagnosticoDto {
  codigoCie10: string;
  descripcion: string;
  principal: boolean;
}

export interface CrearAtencionMedicaDto {
  citaId: number;
  anamnesis: string;
  examenFisico: string;
  indicaciones: string;
  observaciones: string;
  diagnosticos: CrearDiagnosticoDto[];
}
