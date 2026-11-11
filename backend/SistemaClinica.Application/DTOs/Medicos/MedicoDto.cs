using System.Collections.Generic;

namespace SistemaClinica.Application.DTOs.Medicos;

public class MedicoDto
{
    public int Id { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string NumeroColegiatura { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public IReadOnlyList<EspecialidadMedicoDto> Especialidades { get; set; } = Array.Empty<EspecialidadMedicoDto>();
}
