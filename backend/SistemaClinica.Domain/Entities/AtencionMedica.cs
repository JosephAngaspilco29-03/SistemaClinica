using System;
using System.Collections.Generic;

namespace SistemaClinica.Domain.Entities;

public class AtencionMedica
{
    public int Id { get; set; }
    public int CitaId { get; set; }
    public int MedicoId { get; set; }
    public int PacienteId { get; set; }
    public DateTime FechaAtencion { get; set; }
    public string MotivoConsulta { get; set; } = string.Empty;
    public string Anamnesis { get; set; } = string.Empty;
    public string ExamenFisico { get; set; } = string.Empty;
    public string Indicaciones { get; set; } = string.Empty;
    public string Observaciones { get; set; } = string.Empty;

    public Cita Cita { get; set; } = null!;
    public Medico Medico { get; set; } = null!;
    public Paciente Paciente { get; set; } = null!;
    public ICollection<Diagnostico> Diagnosticos { get; set; } = new List<Diagnostico>();
}
