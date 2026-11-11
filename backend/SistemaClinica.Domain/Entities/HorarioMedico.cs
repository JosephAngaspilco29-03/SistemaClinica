using System;
using System.Collections.Generic;

namespace SistemaClinica.Domain.Entities;

public class HorarioMedico
{
    public int Id { get; set; }
    public int MedicoId { get; set; }
    public DateTime Fecha { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public int CuposDisponibles { get; set; }
    public bool Activo { get; set; }

    public Medico Medico { get; set; } = null!;
    public ICollection<Cita> Citas { get; set; } = new List<Cita>();
}
