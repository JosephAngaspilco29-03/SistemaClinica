using System;
using System.Collections.Generic;

namespace SistemaClinica.Application.DTOs.HistorialClinico;

public class HistorialClinicoDto
{
    public int PacienteId { get; set; }
    public string PacienteNombre { get; set; } = string.Empty;
    public string DocumentoIdentidad { get; set; } = string.Empty;
    public DateTime FechaNacimiento { get; set; }
    public string Sexo { get; set; } = string.Empty;
    public IReadOnlyList<HistorialAtencionDto> Atenciones { get; set; } = Array.Empty<HistorialAtencionDto>();
}
