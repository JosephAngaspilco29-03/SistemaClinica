using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Domain.Entities;
using SistemaClinica.Infrastructure.Persistence;

namespace SistemaClinica.Infrastructure.Repositories;

public class MedicoRepository : IMedicoRepository
{
    private readonly SistemaClinicaDbContext _context;

    public MedicoRepository(SistemaClinicaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Medico>> ObtenerTodosAsync()
    {
        return await _context.Medicos
            .AsNoTracking()
            .Include(m => m.MedicoEspecialidades)
                .ThenInclude(me => me.Especialidad)
            .OrderBy(m => m.Apellidos)
            .ThenBy(m => m.Nombres)
            .ToListAsync();
    }

    public async Task<Medico?> ObtenerPorIdAsync(int id)
    {
        return await _context.Medicos
            .Include(m => m.MedicoEspecialidades)
                .ThenInclude(me => me.Especialidad)
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<Medico?> ObtenerPorColegiaturaAsync(string numeroColegiatura)
    {
        return await _context.Medicos
            .FirstOrDefaultAsync(m => m.NumeroColegiatura == numeroColegiatura);
    }

    public async Task<Medico> CrearAsync(Medico medico)
    {
        await _context.Medicos.AddAsync(medico);
        await _context.SaveChangesAsync();
        return medico;
    }

    public async Task ActualizarAsync(Medico medico)
    {
        await _context.SaveChangesAsync();
    }
}
