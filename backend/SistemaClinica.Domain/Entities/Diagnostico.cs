namespace SistemaClinica.Domain.Entities;

public class Diagnostico
{
    public int Id { get; set; }
    public int AtencionMedicaId { get; set; }
    public string CodigoCie10 { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public bool Principal { get; set; }

    public AtencionMedica AtencionMedica { get; set; } = null!;
}
