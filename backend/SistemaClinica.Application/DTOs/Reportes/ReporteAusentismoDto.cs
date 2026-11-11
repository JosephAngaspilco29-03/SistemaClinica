namespace SistemaClinica.Application.DTOs.Reportes;

public class ReporteAusentismoDto
{
    public int TotalCitas { get; set; }
    public int TotalAtendidas { get; set; }
    public int TotalCanceladas { get; set; }
    public int TotalAusentes { get; set; }
    public decimal PorcentajeAusentismo { get; set; }
}
