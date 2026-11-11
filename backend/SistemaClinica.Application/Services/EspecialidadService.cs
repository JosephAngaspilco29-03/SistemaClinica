using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Especialidades;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Application.Interfaces.Services;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Services;

public class EspecialidadService : IEspecialidadService
{
    private readonly IEspecialidadRepository _repository;

    public EspecialidadService(IEspecialidadRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<EspecialidadDto>> ObtenerTodasAsync()
    {
        var especialidades = await _repository.ObtenerTodasAsync();
        return especialidades.Select(MapearADto).ToList();
    }

    public async Task<EspecialidadDto?> ObtenerPorIdAsync(int id)
    {
        var especialidad = await _repository.ObtenerPorIdAsync(id);

        if (especialidad == null)
            return null;

        return MapearADto(especialidad);
    }

    public async Task<EspecialidadDto> CrearAsync(CrearEspecialidadDto dto)
    {
        var nombre = dto.Nombre.Trim();
        var existeNombre = await _repository.ObtenerPorNombreAsync(nombre);
        if (existeNombre != null)
        {
            throw new InvalidOperationException("Ya existe una especialidad registrada con ese nombre.");
        }

        var especialidad = new Especialidad
        {
            Nombre = nombre,
            Descripcion = dto.Descripcion?.Trim() ?? string.Empty,
            Activo = true
        };

        var especialidadCreada = await _repository.CrearAsync(especialidad);

        return MapearADto(especialidadCreada);
    }

    public async Task<bool> ActualizarAsync(int id, ActualizarEspecialidadDto dto)
    {
        var especialidad = await _repository.ObtenerPorIdAsync(id);
        if (especialidad == null)
            return false;

        var nombre = dto.Nombre.Trim();

        if (especialidad.Nombre != nombre)
        {
            var existeNombre = await _repository.ObtenerPorNombreAsync(nombre);
            if (existeNombre != null && existeNombre.Id != id)
            {
                throw new InvalidOperationException("Ya existe una especialidad registrada con ese nombre.");
            }
        }

        especialidad.Nombre = nombre;
        especialidad.Descripcion = dto.Descripcion?.Trim() ?? string.Empty;
        especialidad.Activo = dto.Activo;

        await _repository.ActualizarAsync(especialidad);

        return true;
    }

    public async Task<bool> DesactivarAsync(int id)
    {
        var especialidad = await _repository.ObtenerPorIdAsync(id);
        if (especialidad == null)
            return false;

        if (!especialidad.Activo)
            return true;

        especialidad.Activo = false;
        await _repository.ActualizarAsync(especialidad);

        return true;
    }

    private static EspecialidadDto MapearADto(Especialidad especialidad)
    {
        return new EspecialidadDto
        {
            Id = especialidad.Id,
            Nombre = especialidad.Nombre,
            Descripcion = especialidad.Descripcion,
            Activo = especialidad.Activo
        };
    }
}
