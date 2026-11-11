using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Interfaces.Repositories;

public interface ICitaRepository
{
    Task<IReadOnlyList<Cita>> ObtenerTodasAsync();
    Task<Cita?> ObtenerPorIdAsync(int id);
    Task<Cita> CrearAsync(Cita cita);
    Task ActualizarAsync(Cita cita);
}
