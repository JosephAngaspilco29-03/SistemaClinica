using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.HorariosMedicos;

namespace SistemaClinica.Application.Interfaces.Services;

public interface IHorarioMedicoService
{
    Task<IReadOnlyList<HorarioMedicoDto>> ObtenerTodosAsync();
    Task<HorarioMedicoDto?> ObtenerPorIdAsync(int id);
    Task<IReadOnlyList<HorarioMedicoDto>> ObtenerPorMedicoIdAsync(int medicoId);
    Task<HorarioMedicoDto> CrearAsync(CrearHorarioMedicoDto dto);
    Task<bool> ActualizarAsync(int id, ActualizarHorarioMedicoDto dto);
    Task<bool> DesactivarAsync(int id);

    Task<HorarioMedicoDto> CrearMiHorarioAsync(int medicoId, CrearMiHorarioDto dto);
    Task<bool> ActualizarMiHorarioAsync(int id, int medicoId, ActualizarMiHorarioDto dto);
    Task<bool> DesactivarMiHorarioAsync(int id, int medicoId);
}
