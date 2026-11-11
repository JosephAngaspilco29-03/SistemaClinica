using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Interfaces.Repositories;

public interface IEspecialidadRepository
{
    Task<IReadOnlyList<Especialidad>> ObtenerTodasAsync();
    Task<Especialidad?> ObtenerPorIdAsync(int id);
    Task<Especialidad?> ObtenerPorNombreAsync(string nombre);
    Task<Especialidad> CrearAsync(Especialidad especialidad);
    Task ActualizarAsync(Especialidad especialidad);
}
