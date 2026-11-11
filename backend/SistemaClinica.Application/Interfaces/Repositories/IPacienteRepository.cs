using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Interfaces.Repositories;

public interface IPacienteRepository
{
    Task<IReadOnlyList<Paciente>> ObtenerTodosAsync();
    Task<Paciente?> ObtenerPorIdAsync(int id);
    Task<Paciente?> ObtenerPorDocumentoAsync(string documento);
    Task<Paciente> CrearAsync(Paciente paciente);
    Task ActualizarAsync(Paciente paciente);
}
