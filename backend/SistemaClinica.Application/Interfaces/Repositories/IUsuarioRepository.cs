using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Interfaces.Repositories;

public interface IUsuarioRepository
{
    Task<IReadOnlyList<Usuario>> ObtenerTodosAsync();
    Task<Usuario?> ObtenerPorNombreUsuarioAsync(string nombreUsuario);
    Task<Usuario?> ObtenerPorIdAsync(int id);
    Task<Usuario> CrearAsync(Usuario usuario);
}
