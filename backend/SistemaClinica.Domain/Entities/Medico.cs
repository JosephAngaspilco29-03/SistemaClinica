using System.Collections.Generic;

namespace SistemaClinica.Domain.Entities;

public class Medico
{
    public int Id { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string NumeroColegiatura { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool Activo { get; set; }

    public ICollection<HorarioMedico> Horarios { get; set; } = new List<HorarioMedico>();
    public ICollection<Cita> Citas { get; set; } = new List<Cita>();
    public ICollection<AtencionMedica> AtencionesMedicas { get; set; } = new List<AtencionMedica>();
    public ICollection<MedicoEspecialidad> MedicoEspecialidades { get; set; } = new List<MedicoEspecialidad>();
}
