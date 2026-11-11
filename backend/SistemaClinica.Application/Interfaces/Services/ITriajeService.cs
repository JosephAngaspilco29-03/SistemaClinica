using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Triajes;

namespace SistemaClinica.Application.Interfaces.Services;

public interface ITriajeService
{
    Task<IReadOnlyList<TriajeDto>> ObtenerTodosAsync();
    Task<TriajeDto?> ObtenerPorIdAsync(int id);
    Task<TriajeDto?> ObtenerPorCitaIdAsync(int citaId);
    Task<TriajeDto> CrearAsync(CrearTriajeDto dto);
    Task<bool> ActualizarAsync(int id, ActualizarTriajeDto dto);
}
