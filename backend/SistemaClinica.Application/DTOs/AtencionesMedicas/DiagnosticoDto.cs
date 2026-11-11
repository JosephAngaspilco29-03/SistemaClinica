namespace SistemaClinica.Application.DTOs.AtencionesMedicas;

public class DiagnosticoDto
{
    public int Id { get; set; }
    public string CodigoCie10 { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public bool Principal { get; set; }
}
