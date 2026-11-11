using System;

namespace SistemaClinica.Application.DTOs.HorariosMedicos;

public class CrearMiHorarioDto
{
    public DateTime Fecha { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public int CuposDisponibles { get; set; }
}
