using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Citas;

namespace SistemaClinica.Application.Interfaces.Services;

public interface ICitaService
{
    Task<IReadOnlyList<CitaDto>> ObtenerTodasAsync();
    Task<CitaDto?> ObtenerPorIdAsync(int id);
    Task<CitaDto> CrearAsync(CrearCitaDto dto);
    Task<bool> ReprogramarAsync(int id, ReprogramarCitaDto dto);
    Task<bool> CancelarAsync(int id);
}
