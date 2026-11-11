using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.HistorialClinico;
using SistemaClinica.Application.DTOs.Pacientes;

namespace SistemaClinica.Application.Interfaces.Services;

public interface IHistorialClinicoService
{
    /// <summary>Historial completo de un paciente (uso por paciente o administrador).</summary>
    Task<HistorialClinicoDto?> ObtenerPorPacienteIdAsync(int pacienteId);

    /// <summary>
    /// Historial completo de un paciente, restringido a médicos que hayan
    /// tenido al menos una cita o atención con dicho paciente.
    /// Devuelve null si el paciente no existe; lanza UnauthorizedAccessException si no hay vínculo.
    /// </summary>
    Task<HistorialClinicoDto?> ObtenerPorPacienteIdParaMedicoAsync(int pacienteId, int medicoId);

    /// <summary>Lista de pacientes únicos que tienen al menos una cita con el médico.</summary>
    Task<IReadOnlyList<PacienteResumenDto>> ObtenerPacientesDelMedicoAsync(int medicoId);
}
