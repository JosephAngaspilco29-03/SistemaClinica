using System;
using System.Collections.Generic;

namespace SistemaClinica.Application.DTOs.AtencionesMedicas;

public class AtencionMedicaDto
{
    public int Id { get; set; }
    public int CitaId { get; set; }
    public int PacienteId { get; set; }
    public string PacienteNombre { get; set; } = string.Empty;
    public int MedicoId { get; set; }
    public string MedicoNombre { get; set; } = string.Empty;
    public DateTime FechaAtencion { get; set; }
    public string MotivoConsulta { get; set; } = string.Empty;
    public string Anamnesis { get; set; } = string.Empty;
    public string ExamenFisico { get; set; } = string.Empty;
    public string Indicaciones { get; set; } = string.Empty;
    public string Observaciones { get; set; } = string.Empty;
    public IReadOnlyList<DiagnosticoDto> Diagnosticos { get; set; } = Array.Empty<DiagnosticoDto>();
}
