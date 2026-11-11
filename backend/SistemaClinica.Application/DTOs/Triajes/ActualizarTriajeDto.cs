namespace SistemaClinica.Application.DTOs.Triajes;

public class ActualizarTriajeDto
{
    public decimal PresionSistolica { get; set; }
    public decimal PresionDiastolica { get; set; }
    public decimal Temperatura { get; set; }
    public int FrecuenciaCardiaca { get; set; }
    public decimal Peso { get; set; }
    public decimal Talla { get; set; }
    public string Observaciones { get; set; } = string.Empty;
}
