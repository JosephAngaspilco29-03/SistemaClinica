using System;

namespace SistemaClinica.Application.DTOs.HorariosMedicos;

public class HorarioMedicoDto
{
    public int Id { get; set; }
    public int MedicoId { get; set; }
    public string MedicoNombre { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public int CuposDisponibles { get; set; }
    public bool Activo { get; set; }
    public bool TieneCitas { get; set; }
}
