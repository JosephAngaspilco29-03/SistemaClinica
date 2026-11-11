using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Medicos;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Application.Interfaces.Services;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Services;

public class MedicoService : IMedicoService
{
    private readonly IMedicoRepository _repository;
    private readonly IEspecialidadRepository _especialidadRepository;

    public MedicoService(IMedicoRepository repository, IEspecialidadRepository especialidadRepository)
    {
        _repository = repository;
        _especialidadRepository = especialidadRepository;
    }

    public async Task<IReadOnlyList<MedicoDto>> ObtenerTodosAsync()
    {
        var medicos = await _repository.ObtenerTodosAsync();
        return medicos.Select(MapearADto).ToList();
    }

    public async Task<MedicoDto?> ObtenerPorIdAsync(int id)
    {
        var medico = await _repository.ObtenerPorIdAsync(id);

        if (medico == null)
            return null;

        return MapearADto(medico);
    }

    public async Task<MedicoDto> CrearAsync(CrearMedicoDto dto)
    {
        var existeColegiatura = await _repository.ObtenerPorColegiaturaAsync(dto.NumeroColegiatura);
        if (existeColegiatura != null)
        {
            throw new InvalidOperationException("Ya existe un médico registrado con ese número de colegiatura.");
        }

        var especialidadIdsDistintos = dto.EspecialidadIds.Distinct().ToList();
        await ValidarEspecialidadesAsync(especialidadIdsDistintos);

        var medico = new Medico
        {
            Nombres = dto.Nombres,
            Apellidos = dto.Apellidos,
            NumeroColegiatura = dto.NumeroColegiatura,
            Telefono = dto.Telefono,
            Email = dto.Email,
            Activo = true
        };

        foreach (var especialidadId in especialidadIdsDistintos)
        {
            medico.MedicoEspecialidades.Add(new MedicoEspecialidad
            {
                EspecialidadId = especialidadId
            });
        }

        var medicoCreado = await _repository.CrearAsync(medico);

        var medicoConEspecialidades = await _repository.ObtenerPorIdAsync(medicoCreado.Id);

        return MapearADto(medicoConEspecialidades!);
    }

    public async Task<bool> ActualizarAsync(int id, ActualizarMedicoDto dto)
    {
        var medico = await _repository.ObtenerPorIdAsync(id);
        if (medico == null)
            return false;

        var colegiaturaDuplicada = await _repository.ObtenerPorColegiaturaAsync(dto.NumeroColegiatura);
        if (colegiaturaDuplicada != null && colegiaturaDuplicada.Id != id)
        {
            throw new InvalidOperationException("Ya existe un médico registrado con ese número de colegiatura.");
        }

        var especialidadIdsDistintos = dto.EspecialidadIds.Distinct().ToList();
        await ValidarEspecialidadesAsync(especialidadIdsDistintos);

        medico.Nombres = dto.Nombres;
        medico.Apellidos = dto.Apellidos;
        medico.NumeroColegiatura = dto.NumeroColegiatura;
        medico.Telefono = dto.Telefono;
        medico.Email = dto.Email;
        medico.Activo = dto.Activo;

        // Eliminar relaciones que ya no están en la lista recibida
        var relacionesAEliminar = medico.MedicoEspecialidades
            .Where(me => !especialidadIdsDistintos.Contains(me.EspecialidadId))
            .ToList();

        foreach (var relacion in relacionesAEliminar)
        {
            medico.MedicoEspecialidades.Remove(relacion);
        }

        // Agregar únicamente las relaciones nuevas que todavía no existen
        var idsExistentes = medico.MedicoEspecialidades
            .Select(me => me.EspecialidadId)
            .ToHashSet();

        foreach (var especialidadId in especialidadIdsDistintos)
        {
            if (!idsExistentes.Contains(especialidadId))
            {
                medico.MedicoEspecialidades.Add(new MedicoEspecialidad
                {
                    EspecialidadId = especialidadId
                });
            }
        }

        await _repository.ActualizarAsync(medico);

        return true;
    }

    public async Task<bool> DesactivarAsync(int id)
    {
        var medico = await _repository.ObtenerPorIdAsync(id);
        if (medico == null)
            return false;

        if (!medico.Activo)
            return true;

        medico.Activo = false;
        await _repository.ActualizarAsync(medico);

        return true;
    }

    private async Task ValidarEspecialidadesAsync(IEnumerable<int> especialidadIds)
    {
        foreach (var id in especialidadIds)
        {
            var especialidad = await _especialidadRepository.ObtenerPorIdAsync(id);

            if (especialidad == null)
                throw new InvalidOperationException($"La especialidad con Id {id} no existe.");

            if (!especialidad.Activo)
                throw new InvalidOperationException($"La especialidad '{especialidad.Nombre}' se encuentra inactiva.");
        }
    }

    private static MedicoDto MapearADto(Medico medico)
    {
        return new MedicoDto
        {
            Id = medico.Id,
            Nombres = medico.Nombres,
            Apellidos = medico.Apellidos,
            NumeroColegiatura = medico.NumeroColegiatura,
            Telefono = medico.Telefono,
            Email = medico.Email,
            Activo = medico.Activo,
            Especialidades = medico.MedicoEspecialidades
                .Select(me => new EspecialidadMedicoDto
                {
                    Id = me.Especialidad.Id,
                    Nombre = me.Especialidad.Nombre
                })
                .OrderBy(e => e.Nombre)
                .ToList()
        };
    }
}
