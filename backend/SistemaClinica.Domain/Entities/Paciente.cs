using System;
using System.Collections.Generic;

namespace SistemaClinica.Domain.Entities;

public class Paciente
{
    public int Id { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string DocumentoIdentidad { get; set; } = string.Empty;
    public DateTime FechaNacimiento { get; set; }
    public string Sexo { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public bool Activo { get; set; }

    public ICollection<Cita> Citas { get; set; } = new List<Cita>();
    public ICollection<AtencionMedica> AtencionesMedicas { get; set; } = new List<AtencionMedica>();
}
