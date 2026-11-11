using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Pacientes;

namespace SistemaClinica.Application.Interfaces.Services;

public interface IPacienteService
{
    Task<IReadOnlyList<PacienteDto>> ObtenerTodosAsync();
    Task<PacienteDto?> ObtenerPorIdAsync(int id);
    Task<PacienteDto> CrearAsync(CrearPacienteDto dto);
    Task<bool> ActualizarAsync(int id, ActualizarPacienteDto dto);
    Task<bool> DesactivarAsync(int id);
}
