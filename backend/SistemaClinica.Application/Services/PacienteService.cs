using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Pacientes;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Application.Interfaces.Services;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Services;

public class PacienteService : IPacienteService
{
    private readonly IPacienteRepository _repository;

    public PacienteService(IPacienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<PacienteDto>> ObtenerTodosAsync()
    {
        var pacientes = await _repository.ObtenerTodosAsync();
        return pacientes.Select(MapearADto).ToList();
    }

    public async Task<PacienteDto?> ObtenerPorIdAsync(int id)
    {
        var paciente = await _repository.ObtenerPorIdAsync(id);
        
        if (paciente == null)
            return null;

        return MapearADto(paciente);
    }

    public async Task<PacienteDto> CrearAsync(CrearPacienteDto dto)
    {
        var existeDocumento = await _repository.ObtenerPorDocumentoAsync(dto.DocumentoIdentidad);
        if (existeDocumento != null)
        {
            throw new InvalidOperationException("Ya existe un paciente registrado con ese documento de identidad.");
        }

        var paciente = new Paciente
        {
            Nombres = dto.Nombres,
            Apellidos = dto.Apellidos,
            DocumentoIdentidad = dto.DocumentoIdentidad,
            FechaNacimiento = dto.FechaNacimiento,
            Sexo = dto.Sexo,
            Telefono = dto.Telefono,
            Email = dto.Email,
            Direccion = dto.Direccion,
            Activo = true
        };

        var pacienteCreado = await _repository.CrearAsync(paciente);

        return MapearADto(pacienteCreado);
    }

    public async Task<bool> ActualizarAsync(int id, ActualizarPacienteDto dto)
    {
        var paciente = await _repository.ObtenerPorIdAsync(id);
        if (paciente == null)
            return false;

        paciente.Nombres = dto.Nombres;
        paciente.Apellidos = dto.Apellidos;
        paciente.FechaNacimiento = dto.FechaNacimiento;
        paciente.Sexo = dto.Sexo;
        paciente.Telefono = dto.Telefono;
        paciente.Email = dto.Email;
        paciente.Direccion = dto.Direccion;
        paciente.Activo = dto.Activo;

        await _repository.ActualizarAsync(paciente);

        return true;
    }

    public async Task<bool> DesactivarAsync(int id)
    {
        var paciente = await _repository.ObtenerPorIdAsync(id);
        if (paciente == null)
            return false;

        if (!paciente.Activo)
            return true;

        paciente.Activo = false;
        await _repository.ActualizarAsync(paciente);

        return true;
    }

    private static PacienteDto MapearADto(Paciente paciente)
    {
        return new PacienteDto
        {
            Id = paciente.Id,
            Nombres = paciente.Nombres,
            Apellidos = paciente.Apellidos,
            DocumentoIdentidad = paciente.DocumentoIdentidad,
            FechaNacimiento = paciente.FechaNacimiento,
            Sexo = paciente.Sexo,
            Telefono = paciente.Telefono,
            Email = paciente.Email,
            Direccion = paciente.Direccion,
            Activo = paciente.Activo
        };
    }
}
