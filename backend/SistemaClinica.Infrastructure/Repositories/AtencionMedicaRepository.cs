using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Domain.Entities;
using SistemaClinica.Infrastructure.Persistence;

namespace SistemaClinica.Infrastructure.Repositories;

public class AtencionMedicaRepository : IAtencionMedicaRepository
{
    private readonly SistemaClinicaDbContext _context;

    public AtencionMedicaRepository(SistemaClinicaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<AtencionMedica>> ObtenerTodasAsync()
    {
        return await _context.AtencionesMedicas
            .AsNoTracking()
            .Include(a => a.Paciente)
            .Include(a => a.Medico)
            .Include(a => a.Cita)
                .ThenInclude(c => c.Triaje)
            .Include(a => a.Cita)
                .ThenInclude(c => c.Especialidad)
            .Include(a => a.Diagnosticos)
            .OrderByDescending(a => a.FechaAtencion)
            .ToListAsync();
    }

    public async Task<AtencionMedica?> ObtenerPorIdAsync(int id)
    {
        return await _context.AtencionesMedicas
            .AsNoTracking()
            .Include(a => a.Paciente)
            .Include(a => a.Medico)
            .Include(a => a.Cita)
                .ThenInclude(c => c.Triaje)
            .Include(a => a.Cita)
                .ThenInclude(c => c.Especialidad)
            .Include(a => a.Diagnosticos)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<AtencionMedica?> ObtenerPorCitaIdAsync(int citaId)
    {
        return await _context.AtencionesMedicas
            .AsNoTracking()
            .Include(a => a.Paciente)
            .Include(a => a.Medico)
            .Include(a => a.Cita)
                .ThenInclude(c => c.Triaje)
            .Include(a => a.Cita)
                .ThenInclude(c => c.Especialidad)
            .Include(a => a.Diagnosticos)
            .FirstOrDefaultAsync(a => a.CitaId == citaId);
    }

    public async Task<AtencionMedica> CrearAsync(AtencionMedica atencion)
    {
        await _context.AtencionesMedicas.AddAsync(atencion);
        await _context.SaveChangesAsync();
        return atencion;
    }
}
