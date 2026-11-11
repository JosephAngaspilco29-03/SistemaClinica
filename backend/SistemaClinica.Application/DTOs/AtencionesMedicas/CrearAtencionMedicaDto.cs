using System.Collections.Generic;

namespace SistemaClinica.Application.DTOs.AtencionesMedicas;

public class CrearAtencionMedicaDto
{
    public int CitaId { get; set; }
    public int MedicoId { get; set; }
    public string Anamnesis { get; set; } = string.Empty;
    public string ExamenFisico { get; set; } = string.Empty;
    public string Indicaciones { get; set; } = string.Empty;
    public string Observaciones { get; set; } = string.Empty;
    public List<CrearDiagnosticoDto> Diagnosticos { get; set; } = new List<CrearDiagnosticoDto>();
}
