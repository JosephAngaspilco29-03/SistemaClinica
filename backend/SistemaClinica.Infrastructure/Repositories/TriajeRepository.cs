using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Domain.Entities;
using SistemaClinica.Infrastructure.Persistence;

namespace SistemaClinica.Infrastructure.Repositories;

public class TriajeRepository : ITriajeRepository
{
    private readonly SistemaClinicaDbContext _context;

    public TriajeRepository(SistemaClinicaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Triaje>> ObtenerTodosAsync()
    {
        return await _context.Triajes
            .AsNoTracking()
            .OrderByDescending(t => t.FechaRegistro)
            .ToListAsync();
    }

    public async Task<Triaje?> ObtenerPorIdAsync(int id)
    {
        return await _context.Triajes
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<Triaje?> ObtenerPorCitaIdAsync(int citaId)
    {
        return await _context.Triajes
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.CitaId == citaId);
    }

    public async Task<Triaje> CrearAsync(Triaje triaje)
    {
        await _context.Triajes.AddAsync(triaje);
        await _context.SaveChangesAsync();
        return triaje;
    }

    public async Task ActualizarAsync(Triaje triaje)
    {
        await _context.SaveChangesAsync();
    }
}
