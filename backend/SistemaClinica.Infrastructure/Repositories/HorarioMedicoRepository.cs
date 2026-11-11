using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Domain.Entities;
using SistemaClinica.Infrastructure.Persistence;

namespace SistemaClinica.Infrastructure.Repositories;

public class HorarioMedicoRepository : IHorarioMedicoRepository
{
    private readonly SistemaClinicaDbContext _context;

    public HorarioMedicoRepository(SistemaClinicaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<HorarioMedico>> ObtenerTodosAsync()
    {
        return await _context.HorariosMedicos
            .AsNoTracking()
            .Include(h => h.Medico)
            .Include(h => h.Citas)
            .OrderBy(h => h.Fecha)
            .ThenBy(h => h.HoraInicio)
            .ToListAsync();
    }

    public async Task<HorarioMedico?> ObtenerPorIdAsync(int id)
    {
        return await _context.HorariosMedicos
            .Include(h => h.Medico)
            .Include(h => h.Citas)
            .FirstOrDefaultAsync(h => h.Id == id);
    }

    public async Task<IReadOnlyList<HorarioMedico>> ObtenerPorMedicoIdAsync(int medicoId)
    {
        return await _context.HorariosMedicos
            .AsNoTracking()
            .Include(h => h.Medico)
            .Include(h => h.Citas)
            .Where(h => h.MedicoId == medicoId)
            .OrderByDescending(h => h.Fecha)
            .ThenBy(h => h.HoraInicio)
            .ToListAsync();
    }

    public async Task<bool> ExisteSolapamientoAsync(int medicoId, System.DateTime fecha, System.TimeSpan horaInicio, System.TimeSpan horaFin, int? horarioExcluidoId = null)
    {
        var query = _context.HorariosMedicos
            .Where(h => h.MedicoId == medicoId 
                        && h.Fecha.Date == fecha.Date 
                        && h.Activo); // Only check active schedules

        if (horarioExcluidoId.HasValue)
        {
            query = query.Where(h => h.Id != horarioExcluidoId.Value);
        }

        // Logic: newStart < existingEnd && newEnd > existingStart
        return await query.AnyAsync(h => horaInicio < h.HoraFin && horaFin > h.HoraInicio);
    }

    public async Task<bool> TieneCitasAsociadasAsync(int horarioMedicoId)
    {
        return await _context.HorariosMedicos
            .Where(h => h.Id == horarioMedicoId)
            .AnyAsync(h => h.Citas.Any());
    }

    public async Task<HorarioMedico> CrearAsync(HorarioMedico horario)
    {
        await _context.HorariosMedicos.AddAsync(horario);
        await _context.SaveChangesAsync();
        return horario;
    }

    public async Task ActualizarAsync(HorarioMedico horario)
    {
        await _context.SaveChangesAsync();
    }
}
