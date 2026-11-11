using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.AtencionesMedicas;

namespace SistemaClinica.Application.Interfaces.Services;

public interface IAtencionMedicaService
{
    Task<IReadOnlyList<AtencionMedicaDto>> ObtenerTodasAsync();
    Task<AtencionMedicaDto?> ObtenerPorIdAsync(int id);
    Task<AtencionMedicaDto?> ObtenerPorCitaIdAsync(int citaId);
    Task<AtencionMedicaDto> CrearAsync(CrearAtencionMedicaDto dto);
}
