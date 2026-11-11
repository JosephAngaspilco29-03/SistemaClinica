namespace SistemaClinica.Application.DTOs.HistorialClinico;

public class HistorialDiagnosticoDto
{
    public int Id { get; set; }
    public string CodigoCie10 { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public bool Principal { get; set; }
}
