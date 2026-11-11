export interface HistorialDiagnostico {
  id: number;
  codigoCie10: string;
  descripcion: string;
  principal: boolean;
}

export interface HistorialTriaje {
  presionSistolica: number;
  presionDiastolica: number;
  temperatura: number;
  frecuenciaCardiaca: number;
  peso: number;
  talla: number;
  imc: number;
  fechaRegistro: string;
  observaciones: string;
}

export interface HistorialAtencion {
  atencionMedicaId: number;
  citaId: number;
  fechaAtencion: string;
  medicoId: number;
  medicoNombre: string;
  especialidadNombre: string;
  motivoConsulta: string;
  anamnesis: string;
  examenFisico: string;
  indicaciones: string;
  observaciones: string;
  triaje: HistorialTriaje | null;
  diagnosticos: HistorialDiagnostico[];
}

export interface HistorialClinico {
  pacienteId: number;
  pacienteNombre: string;
  documentoIdentidad: string;
  fechaNacimiento: string;
  sexo: string;
  atenciones: HistorialAtencion[];
}

export interface PacienteResumen {
  id: number;
  nombreCompleto: string;
  documentoIdentidad: string;
}
