using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaClinica.Application.DTOs.Auth;
using SistemaClinica.Application.Interfaces.Services;

namespace SistemaClinica.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // POST /api/Auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var usuario = await _authService.AutenticarAsync(dto);

        if (usuario == null)
            return Unauthorized(new { mensaje = "Usuario o contraseña incorrectos." });

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.NombreUsuario),
            new Claim(ClaimTypes.Role, usuario.Rol)
        };

        if (usuario.PacienteId.HasValue)
            claims.Add(new Claim("PacienteId", usuario.PacienteId.Value.ToString()));

        if (usuario.MedicoId.HasValue)
            claims.Add(new Claim("MedicoId", usuario.MedicoId.Value.ToString()));

        var identity = new ClaimsIdentity(
            claims,
            CookieAuthenticationDefaults.AuthenticationScheme);

        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal);

        return Ok(usuario);
    }

    // POST /api/Auth/registro
    [HttpPost("registro")]
    [AllowAnonymous]
    public async Task<IActionResult> RegistrarPaciente([FromBody] RegistroPublicoDto dto)
    {
        try
        {
            var usuarioCreado = await _authService.RegistrarPacienteAsync(dto);
            return StatusCode(201, usuarioCreado);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    // POST /api/Auth/logout
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    // GET /api/Auth/me
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var nombreUsuario = User.FindFirstValue(ClaimTypes.Name);
        var rol = User.FindFirstValue(ClaimTypes.Role);
        var pacienteIdStr = User.FindFirstValue("PacienteId");
        var medicoIdStr = User.FindFirstValue("MedicoId");

        return Ok(new
        {
            Id = int.TryParse(idStr, out var id) ? id : 0,
            NombreUsuario = nombreUsuario ?? string.Empty,
            Rol = rol ?? string.Empty,
            PacienteId = int.TryParse(pacienteIdStr, out var pId) ? (int?)pId : null,
            MedicoId = int.TryParse(medicoIdStr, out var mId) ? (int?)mId : null
        });
    }

    // GET /api/Auth/usuarios
    [HttpGet("usuarios")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ObtenerUsuarios()
    {
        var usuarios = await _authService.ObtenerUsuariosAsync();
        return Ok(usuarios);
    }

    // POST /api/Auth/usuarios
    [HttpPost("usuarios")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> CrearUsuario([FromBody] CrearUsuarioDto dto)
    {
        try
        {
            var usuarioCreado = await _authService.CrearUsuarioAsync(dto);
            return StatusCode(201, usuarioCreado);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    // PUT /api/Auth/usuarios/{id}/password
    [HttpPut("usuarios/{id:int}/password")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> RestablecerPassword(int id, [FromBody] RestablecerPasswordDto dto)
    {
        try
        {
            var actualizado = await _authService.RestablecerPasswordAsync(id, dto);
            if (!actualizado)
                return NotFound(new { mensaje = "El usuario no existe." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }
}
