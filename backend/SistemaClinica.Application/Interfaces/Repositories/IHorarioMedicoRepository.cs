using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Interfaces.Repositories;

public interface IHorarioMedicoRepository
{
    Task<IReadOnlyList<HorarioMedico>> ObtenerTodosAsync();
    Task<HorarioMedico?> ObtenerPorIdAsync(int id);
    Task<IReadOnlyList<HorarioMedico>> ObtenerPorMedicoIdAsync(int medicoId);
    Task<bool> ExisteSolapamientoAsync(int medicoId, DateTime fecha, TimeSpan horaInicio, TimeSpan horaFin, int? horarioExcluidoId = null);
    Task<bool> TieneCitasAsociadasAsync(int horarioMedicoId);
    Task<HorarioMedico> CrearAsync(HorarioMedico horario);
    Task ActualizarAsync(HorarioMedico horario);
}
