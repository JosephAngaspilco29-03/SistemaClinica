using System;
using System.Collections.Generic;

namespace SistemaClinica.Application.DTOs.HistorialClinico;

public class HistorialAtencionDto
{
    public int AtencionMedicaId { get; set; }
    public int CitaId { get; set; }
    public DateTime FechaAtencion { get; set; }
    public int MedicoId { get; set; }
    public string MedicoNombre { get; set; } = string.Empty;
    public string EspecialidadNombre { get; set; } = string.Empty;
    public string MotivoConsulta { get; set; } = string.Empty;
    public string Anamnesis { get; set; } = string.Empty;
    public string ExamenFisico { get; set; } = string.Empty;
    public string Indicaciones { get; set; } = string.Empty;
    public string Observaciones { get; set; } = string.Empty;
    public HistorialTriajeDto? Triaje { get; set; }
    public IReadOnlyList<HistorialDiagnosticoDto> Diagnosticos { get; set; } = Array.Empty<HistorialDiagnosticoDto>();
}
