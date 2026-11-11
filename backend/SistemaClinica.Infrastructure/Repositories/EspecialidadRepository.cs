using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Domain.Entities;
using SistemaClinica.Infrastructure.Persistence;

namespace SistemaClinica.Infrastructure.Repositories;

public class EspecialidadRepository : IEspecialidadRepository
{
    private readonly SistemaClinicaDbContext _context;

    public EspecialidadRepository(SistemaClinicaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Especialidad>> ObtenerTodasAsync()
    {
        return await _context.Especialidades
            .AsNoTracking()
            .OrderBy(e => e.Nombre)
            .ToListAsync();
    }

    public async Task<Especialidad?> ObtenerPorIdAsync(int id)
    {
        return await _context.Especialidades
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<Especialidad?> ObtenerPorNombreAsync(string nombre)
    {
        return await _context.Especialidades
            .FirstOrDefaultAsync(e => e.Nombre == nombre);
    }

    public async Task<Especialidad> CrearAsync(Especialidad especialidad)
    {
        await _context.Especialidades.AddAsync(especialidad);
        await _context.SaveChangesAsync();
        return especialidad;
    }

    public async Task ActualizarAsync(Especialidad especialidad)
    {
        _context.Especialidades.Update(especialidad);
        await _context.SaveChangesAsync();
    }
}
