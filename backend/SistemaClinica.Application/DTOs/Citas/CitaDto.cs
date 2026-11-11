using System;

namespace SistemaClinica.Application.DTOs.Citas;

public class CitaDto
{
    public int Id { get; set; }
    public int PacienteId { get; set; }
    public string PacienteNombre { get; set; } = string.Empty;
    public int MedicoId { get; set; }
    public string MedicoNombre { get; set; } = string.Empty;
    public int EspecialidadId { get; set; }
    public string EspecialidadNombre { get; set; } = string.Empty;
    public int HorarioMedicoId { get; set; }
    public DateTime FechaHora { get; set; }
    public string MotivoConsulta { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; }
}
