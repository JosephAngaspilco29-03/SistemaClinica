using System;
using System.ComponentModel.DataAnnotations;

namespace SistemaClinica.Application.DTOs.HorariosMedicos;

public class CrearHorarioMedicoDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un médico.")]
    public int MedicoId { get; set; }

    [Required(ErrorMessage = "La fecha es obligatoria.")]
    public DateTime Fecha { get; set; }

    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }

    [Range(1, 1000, ErrorMessage = "Los cupos disponibles deben estar entre 1 y 1000.")]
    public int CuposDisponibles { get; set; }
}
