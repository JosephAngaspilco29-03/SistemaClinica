namespace SistemaClinica.Application.DTOs.Pacientes;

/// <summary>
/// Resumen mínimo de paciente para la lista del médico en el módulo de historial clínico.
/// </summary>
public class PacienteResumenDto
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string DocumentoIdentidad { get; set; } = string.Empty;
}
