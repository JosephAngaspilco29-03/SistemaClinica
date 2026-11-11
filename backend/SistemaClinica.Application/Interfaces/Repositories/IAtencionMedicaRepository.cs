using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Interfaces.Repositories;

public interface IAtencionMedicaRepository
{
    Task<IReadOnlyList<AtencionMedica>> ObtenerTodasAsync();
    Task<AtencionMedica?> ObtenerPorIdAsync(int id);
    Task<AtencionMedica?> ObtenerPorCitaIdAsync(int citaId);
    Task<AtencionMedica> CrearAsync(AtencionMedica atencion);
}
