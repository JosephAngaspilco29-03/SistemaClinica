using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Domain.Entities;
using SistemaClinica.Infrastructure.Persistence;

namespace SistemaClinica.Infrastructure.Repositories;

public class PacienteRepository : IPacienteRepository
{
    private readonly SistemaClinicaDbContext _context;

    public PacienteRepository(SistemaClinicaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Paciente>> ObtenerTodosAsync()
    {
        return await _context.Pacientes
            .AsNoTracking()
            .OrderBy(p => p.Apellidos)
            .ThenBy(p => p.Nombres)
            .ToListAsync();
    }

    public async Task<Paciente?> ObtenerPorIdAsync(int id)
    {
        return await _context.Pacientes
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Paciente?> ObtenerPorDocumentoAsync(string documento)
    {
        return await _context.Pacientes
            .FirstOrDefaultAsync(p => p.DocumentoIdentidad == documento);
    }

    public async Task<Paciente> CrearAsync(Paciente paciente)
    {
        await _context.Pacientes.AddAsync(paciente);
        await _context.SaveChangesAsync();
        return paciente;
    }

    public async Task ActualizarAsync(Paciente paciente)
    {
        _context.Pacientes.Update(paciente);
        await _context.SaveChangesAsync();
    }
}
