using System.Collections.Generic;

namespace SistemaClinica.Domain.Entities;

public class Especialidad
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public bool Activo { get; set; }

    public ICollection<MedicoEspecialidad> MedicoEspecialidades { get; set; } = new List<MedicoEspecialidad>();
    public ICollection<Cita> Citas { get; set; } = new List<Cita>();
}
