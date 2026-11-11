using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Interfaces.Repositories;

public interface ITriajeRepository
{
    Task<IReadOnlyList<Triaje>> ObtenerTodosAsync();
    Task<Triaje?> ObtenerPorIdAsync(int id);
    Task<Triaje?> ObtenerPorCitaIdAsync(int citaId);
    Task<Triaje> CrearAsync(Triaje triaje);
    Task ActualizarAsync(Triaje triaje);
}
