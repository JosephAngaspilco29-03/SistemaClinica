using System;

namespace SistemaClinica.Application.DTOs.Reportes;

public class ReporteAtencionItemDto
{
    public int AtencionMedicaId { get; set; }
    public int CitaId { get; set; }
    public DateTime FechaAtencion { get; set; }
    public int PacienteId { get; set; }
    public string PacienteNombre { get; set; } = string.Empty;
    public int MedicoId { get; set; }
    public string MedicoNombre { get; set; } = string.Empty;
    public string MotivoConsulta { get; set; } = string.Empty;
    public string DiagnosticoPrincipal { get; set; } = string.Empty;
}
