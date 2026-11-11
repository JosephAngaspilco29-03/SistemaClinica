export interface ReporteAtencionItem {
  atencionMedicaId: number;
  citaId: number;
  fechaAtencion: string;
  pacienteId: number;
  pacienteNombre: string;
  medicoId: number;
  medicoNombre: string;
  motivoConsulta: string;
  diagnosticoPrincipal: string;
}

export interface ReporteAtenciones {
  totalAtenciones: number;
  atenciones: ReporteAtencionItem[];
}

export interface ReporteAusentismo {
  totalCitas: number;
  totalAtendidas: number;
  totalCanceladas: number;
  totalAusentes: number;
  porcentajeAusentismo: number;
}

