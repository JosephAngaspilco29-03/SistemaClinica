using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Interfaces.Repositories;

public interface IMedicoRepository
{
    Task<IReadOnlyList<Medico>> ObtenerTodosAsync();
    Task<Medico?> ObtenerPorIdAsync(int id);
    Task<Medico?> ObtenerPorColegiaturaAsync(string numeroColegiatura);
    Task<Medico> CrearAsync(Medico medico);
    Task ActualizarAsync(Medico medico);
}
