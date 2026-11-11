namespace SistemaClinica.Application.DTOs.AtencionesMedicas;

public class CrearDiagnosticoDto
{
    public string CodigoCie10 { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public bool Principal { get; set; }
}
