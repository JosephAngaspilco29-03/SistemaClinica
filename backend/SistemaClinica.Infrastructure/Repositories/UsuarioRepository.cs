using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Domain.Entities;
using SistemaClinica.Infrastructure.Persistence;

namespace SistemaClinica.Infrastructure.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly SistemaClinicaDbContext _context;

    public UsuarioRepository(SistemaClinicaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Usuario>> ObtenerTodosAsync()
    {
        return await _context.Usuarios
            .AsNoTracking()
            .OrderBy(u => u.NombreUsuario)
            .ToListAsync();
    }

    public async Task<Usuario?> ObtenerPorNombreUsuarioAsync(string nombreUsuario)
    {
        return await _context.Usuarios
            .FirstOrDefaultAsync(u => u.NombreUsuario == nombreUsuario);
    }

    public async Task<Usuario?> ObtenerPorIdAsync(int id)
    {
        return await _context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<Usuario> CrearAsync(Usuario usuario)
    {
        await _context.Usuarios.AddAsync(usuario);
        await _context.SaveChangesAsync();
        return usuario;
    }

    public async Task<Usuario?> ObtenerParaActualizarAsync(int id)
    {
        return await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task ActualizarPasswordHashAsync(Usuario usuario, string passwordHash)
    {
        // Solo se modifica la columna PasswordHash; el resto de datos del usuario no cambia.
        usuario.PasswordHash = passwordHash;
        _context.Entry(usuario).Property(u => u.PasswordHash).IsModified = true;
        await _context.SaveChangesAsync();
    }
}
