using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Especialidades;

namespace SistemaClinica.Application.Interfaces.Services;

public interface IEspecialidadService
{
    Task<IReadOnlyList<EspecialidadDto>> ObtenerTodasAsync();
    Task<EspecialidadDto?> ObtenerPorIdAsync(int id);
    Task<EspecialidadDto> CrearAsync(CrearEspecialidadDto dto);
    Task<bool> ActualizarAsync(int id, ActualizarEspecialidadDto dto);
    Task<bool> DesactivarAsync(int id);
}
