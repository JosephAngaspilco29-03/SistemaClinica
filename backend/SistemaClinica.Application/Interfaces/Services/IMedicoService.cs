using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Medicos;

namespace SistemaClinica.Application.Interfaces.Services;

public interface IMedicoService
{
    Task<IReadOnlyList<MedicoDto>> ObtenerTodosAsync();
    Task<MedicoDto?> ObtenerPorIdAsync(int id);
    Task<MedicoDto> CrearAsync(CrearMedicoDto dto);
    Task<bool> ActualizarAsync(int id, ActualizarMedicoDto dto);
    Task<bool> DesactivarAsync(int id);
}
