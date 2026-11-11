using System;

namespace SistemaClinica.Domain.Entities;

public class Cita
{
    public int Id { get; set; }
    public int PacienteId { get; set; }
    public int MedicoId { get; set; }
    public int EspecialidadId { get; set; }
    public int HorarioMedicoId { get; set; }
    public DateTime FechaHora { get; set; }
    public string MotivoConsulta { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; }

    public Paciente Paciente { get; set; } = null!;
    public Medico Medico { get; set; } = null!;
    public Especialidad Especialidad { get; set; } = null!;
    public HorarioMedico HorarioMedico { get; set; } = null!;
    public Triaje? Triaje { get; set; }
    public AtencionMedica? AtencionMedica { get; set; }
}
