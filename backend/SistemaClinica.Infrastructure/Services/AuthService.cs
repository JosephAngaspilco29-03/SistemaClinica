using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using SistemaClinica.Application.DTOs.Auth;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Application.Interfaces.Services;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Infrastructure.Services;

public class AuthService : IAuthService
{
    private static readonly string[] RolesValidos =
    [
        "Administrador",
        "Medico",
        "Enfermero",
        "Paciente"
    ];

    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPacienteRepository _pacienteRepository;
    private readonly IMedicoRepository _medicoRepository;
    private readonly PasswordHasher<Usuario> _passwordHasher;

    public AuthService(
        IUsuarioRepository usuarioRepository,
        IPacienteRepository pacienteRepository,
        IMedicoRepository medicoRepository)
    {
        _usuarioRepository = usuarioRepository;
        _pacienteRepository = pacienteRepository;
        _medicoRepository = medicoRepository;
        _passwordHasher = new PasswordHasher<Usuario>();
    }

    public async Task<UsuarioAutenticadoDto?> AutenticarAsync(LoginDto dto)
    {
        var usuario = await _usuarioRepository.ObtenerPorNombreUsuarioAsync(dto.NombreUsuario);

        if (usuario == null)
            return null;

        if (!usuario.Activo)
            return null;

        var resultado = _passwordHasher.VerifyHashedPassword(
            usuario,
            usuario.PasswordHash,
            dto.Password);

        if (resultado == PasswordVerificationResult.Failed)
            return null;

        return new UsuarioAutenticadoDto
        {
            Id = usuario.Id,
            NombreUsuario = usuario.NombreUsuario,
            Rol = usuario.Rol,
            PacienteId = usuario.PacienteId,
            MedicoId = usuario.MedicoId
        };
    }

    public async Task<UsuarioDto> CrearUsuarioAsync(CrearUsuarioDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NombreUsuario))
            throw new InvalidOperationException("El nombre de usuario es obligatorio.");

        if (dto.NombreUsuario != dto.NombreUsuario.Trim())
            throw new InvalidOperationException("El nombre de usuario no puede tener espacios al inicio o al final.");

        if (string.IsNullOrEmpty(dto.Password) || dto.Password.Length < 8)
            throw new InvalidOperationException("La contraseña es obligatoria y debe tener al menos 8 caracteres.");

        // La creación administrativa solo permite personal: Medico y Enfermero.
        // Los pacientes se registran solos desde la página pública y el Administrador no se crea desde aquí.
        if (dto.Rol != "Medico" && dto.Rol != "Enfermero")
            throw new InvalidOperationException(
                "Desde Administración solo se pueden crear cuentas con rol Medico o Enfermero.");

        var existente = await _usuarioRepository.ObtenerPorNombreUsuarioAsync(dto.NombreUsuario);
        if (existente != null)
            throw new InvalidOperationException(
                $"Ya existe un usuario con el nombre '{dto.NombreUsuario}'.");

        if (dto.PacienteId.HasValue)
            throw new InvalidOperationException($"El rol {dto.Rol} no debe tener PacienteId.");

        if (dto.Rol == "Medico")
        {
            if (!dto.MedicoId.HasValue)
                throw new InvalidOperationException("El rol Medico requiere un MedicoId.");

            var medico = await _medicoRepository.ObtenerPorIdAsync(dto.MedicoId.Value);
            if (medico == null)
                throw new InvalidOperationException(
                    $"No existe un Médico con Id {dto.MedicoId.Value}.");

            if (!medico.Activo)
                throw new InvalidOperationException("No se puede crear una cuenta para un médico inactivo.");

            var usuarios = await _usuarioRepository.ObtenerTodosAsync();
            if (usuarios.Any(u => u.MedicoId == dto.MedicoId.Value))
                throw new InvalidOperationException("Este médico ya tiene una cuenta de usuario asociada.");
        }
        else if (dto.MedicoId.HasValue)
        {
            // Enfermero
            throw new InvalidOperationException("El rol Enfermero no debe tener MedicoId.");
        }
        var nuevoUsuario = new Usuario
        {
            NombreUsuario = dto.NombreUsuario,
            Rol = dto.Rol,
            Activo = true,
            PacienteId = dto.PacienteId,
            MedicoId = dto.MedicoId
        };

        nuevoUsuario.PasswordHash = _passwordHasher.HashPassword(nuevoUsuario, dto.Password);

        var creado = await _usuarioRepository.CrearAsync(nuevoUsuario);

        return MapearADto(creado);
    }

    public async Task<UsuarioDto> RegistrarPacienteAsync(RegistroPublicoDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NombreUsuario))
            throw new InvalidOperationException("El nombre de usuario es obligatorio.");

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
            throw new InvalidOperationException("La contraseña es obligatoria y debe tener al menos 8 caracteres.");

        var existente = await _usuarioRepository.ObtenerPorNombreUsuarioAsync(dto.NombreUsuario);
        if (existente != null)
            throw new InvalidOperationException($"Ya existe un usuario con el nombre '{dto.NombreUsuario}'.");

        var pacienteExistente = await _pacienteRepository.ObtenerPorDocumentoAsync(dto.DocumentoIdentidad);
        if (pacienteExistente != null)
            throw new InvalidOperationException($"El documento de identidad '{dto.DocumentoIdentidad}' ya está registrado.");

        var nuevoPaciente = new Paciente
        {
            Nombres = dto.Nombres,
            Apellidos = dto.Apellidos,
            DocumentoIdentidad = dto.DocumentoIdentidad,
            FechaNacimiento = dto.FechaNacimiento,
            Sexo = dto.Sexo,
            Telefono = dto.Telefono ?? string.Empty,
            Email = dto.Email ?? string.Empty,
            Direccion = dto.Direccion ?? string.Empty,
            Activo = true
        };

        var nuevoUsuario = new Usuario
        {
            NombreUsuario = dto.NombreUsuario,
            Rol = "Paciente",
            Activo = true,
            Paciente = nuevoPaciente
        };

        nuevoUsuario.PasswordHash = _passwordHasher.HashPassword(nuevoUsuario, dto.Password);

        var creado = await _usuarioRepository.CrearAsync(nuevoUsuario);

        return MapearADto(creado);
    }

    public async Task<IReadOnlyList<UsuarioDto>> ObtenerUsuariosAsync()
    {
        var usuarios = await _usuarioRepository.ObtenerTodosAsync();
        return usuarios.Select(MapearADto).ToList();
    }

    public async Task<bool> RestablecerPasswordAsync(int usuarioId, RestablecerPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NuevaPassword) || dto.NuevaPassword.Length < 8)
            throw new InvalidOperationException("La contraseña es obligatoria y debe tener al menos 8 caracteres.");

        if (dto.NuevaPassword.Length > 100)
            throw new InvalidOperationException("La contraseña no puede superar los 100 caracteres.");

        var usuario = await _usuarioRepository.ObtenerParaActualizarAsync(usuarioId);
        if (usuario == null)
            return false;

        // Mismo mecanismo de hash que el alta de usuarios y la verificación del login.
        var nuevoHash = _passwordHasher.HashPassword(usuario, dto.NuevaPassword);
        await _usuarioRepository.ActualizarPasswordHashAsync(usuario, nuevoHash);

        return true;
    }

    private static UsuarioDto MapearADto(Usuario usuario)
    {
        return new UsuarioDto
        {
            Id = usuario.Id,
            NombreUsuario = usuario.NombreUsuario,
            Rol = usuario.Rol,
            Activo = usuario.Activo,
            PacienteId = usuario.PacienteId,
            MedicoId = usuario.MedicoId
        };
    }
}
