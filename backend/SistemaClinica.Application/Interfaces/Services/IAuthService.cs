using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Auth;

namespace SistemaClinica.Application.Interfaces.Services;

public interface IAuthService
{
    Task<UsuarioAutenticadoDto?> AutenticarAsync(LoginDto dto);
    Task<UsuarioDto> CrearUsuarioAsync(CrearUsuarioDto dto);
    Task<UsuarioDto> RegistrarPacienteAsync(RegistroPublicoDto dto);
    Task<IReadOnlyList<UsuarioDto>> ObtenerUsuariosAsync();
    Task<bool> RestablecerPasswordAsync(int usuarioId, RestablecerPasswordDto dto);
}
