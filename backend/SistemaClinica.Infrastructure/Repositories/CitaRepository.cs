using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Domain.Entities;
using SistemaClinica.Infrastructure.Persistence;

namespace SistemaClinica.Infrastructure.Repositories;

public class CitaRepository : ICitaRepository
{
    private readonly SistemaClinicaDbContext _context;

    public CitaRepository(SistemaClinicaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Cita>> ObtenerTodasAsync()
    {
        return await _context.Citas
            .AsNoTracking()
            .Include(c => c.Paciente)
            .Include(c => c.Medico)
            .Include(c => c.Especialidad)
            .Include(c => c.HorarioMedico)
            .OrderBy(c => c.FechaHora)
            .ToListAsync();
    }

    public async Task<Cita?> ObtenerPorIdAsync(int id)
    {
        return await _context.Citas
            .Include(c => c.Paciente)
            .Include(c => c.Medico)
            .Include(c => c.Especialidad)
            .Include(c => c.HorarioMedico)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Cita> CrearAsync(Cita cita)
    {
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        return cita;
    }

    public async Task ActualizarAsync(Cita cita)
    {
        await _context.SaveChangesAsync();
    }
}
