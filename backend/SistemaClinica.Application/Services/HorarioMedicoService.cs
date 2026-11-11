using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.HorariosMedicos;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Application.Interfaces.Services;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Services;

public class HorarioMedicoService : IHorarioMedicoService
{
    private readonly IHorarioMedicoRepository _repository;
    private readonly IMedicoRepository _medicoRepository;

    public HorarioMedicoService(IHorarioMedicoRepository repository, IMedicoRepository medicoRepository)
    {
        _repository = repository;
        _medicoRepository = medicoRepository;
    }

    public async Task<IReadOnlyList<HorarioMedicoDto>> ObtenerTodosAsync()
    {
        var horarios = await _repository.ObtenerTodosAsync();
        return horarios.Select(MapearADto).ToList();
    }

    public async Task<HorarioMedicoDto?> ObtenerPorIdAsync(int id)
    {
        var horario = await _repository.ObtenerPorIdAsync(id);

        if (horario == null)
            return null;

        return MapearADto(horario);
    }

    public async Task<HorarioMedicoDto> CrearAsync(CrearHorarioMedicoDto dto)
    {
        var medico = await _medicoRepository.ObtenerPorIdAsync(dto.MedicoId);
        if (medico == null)
        {
            throw new InvalidOperationException($"El médico con Id {dto.MedicoId} no existe.");
        }

        if (!medico.Activo)
        {
            throw new InvalidOperationException("No se puede asignar un horario a un médico inactivo.");
        }

        if (dto.HoraFin <= dto.HoraInicio)
        {
            throw new InvalidOperationException("La hora de fin debe ser mayor que la hora de inicio.");
        }

        if (dto.CuposDisponibles <= 0)
        {
            throw new InvalidOperationException("Los cupos disponibles deben ser mayores que cero.");
        }

        if (dto.Fecha.Date < DateTime.Now.Date)
        {
            throw new InvalidOperationException("No se puede crear un horario para una fecha pasada.");
        }

        if (dto.Fecha.Date == DateTime.Now.Date && dto.HoraFin <= DateTime.Now.TimeOfDay)
        {
            throw new InvalidOperationException("No se puede crear un horario que ya terminó hoy.");
        }

        var existeSolapamiento = await _repository.ExisteSolapamientoAsync(dto.MedicoId, dto.Fecha, dto.HoraInicio, dto.HoraFin);
        if (existeSolapamiento)
        {
            throw new InvalidOperationException("El médico ya tiene un horario activo que se solapa o duplica con el indicado.");
        }

        var horario = new HorarioMedico
        {
            MedicoId = dto.MedicoId,
            Fecha = dto.Fecha,
            HoraInicio = dto.HoraInicio,
            HoraFin = dto.HoraFin,
            CuposDisponibles = dto.CuposDisponibles,
            Activo = true
        };

        var horarioCreado = await _repository.CrearAsync(horario);
        
        var horarioConMedico = await _repository.ObtenerPorIdAsync(horarioCreado.Id);

        return MapearADto(horarioConMedico!);
    }

    public async Task<bool> ActualizarAsync(int id, ActualizarHorarioMedicoDto dto)
    {
        var horario = await _repository.ObtenerPorIdAsync(id);
        if (horario == null)
            return false;

        if (dto.HoraFin <= dto.HoraInicio)
        {
            throw new InvalidOperationException("La hora de fin debe ser mayor que la hora de inicio.");
        }

        var tieneCitas = await _repository.TieneCitasAsociadasAsync(id);
        if (tieneCitas)
        {
            if (horario.Fecha != dto.Fecha || horario.HoraInicio != dto.HoraInicio || horario.HoraFin != dto.HoraFin)
            {
                throw new InvalidOperationException("Este horario ya tiene citas asociadas. Para proteger las reservas, no es posible cambiar su fecha u horas.");
            }

            if (horario.CuposDisponibles != dto.CuposDisponibles)
            {
                throw new InvalidOperationException("Este horario ya tiene citas asociadas. Los cupos disponibles no pueden modificarse manualmente porque se gestionan automáticamente al reservar o cancelar citas.");
            }

            if (dto.CuposDisponibles < 0)
            {
                throw new InvalidOperationException("Los cupos disponibles no pueden ser negativos.");
            }
        }
        else
        {
            if (dto.CuposDisponibles <= 0)
            {
                throw new InvalidOperationException("Los cupos disponibles deben ser mayores que cero.");
            }

            if (dto.Fecha.Date < DateTime.Now.Date)
            {
                throw new InvalidOperationException("No se puede modificar un horario para una fecha pasada.");
            }

            if (dto.Fecha.Date == DateTime.Now.Date && dto.HoraFin <= DateTime.Now.TimeOfDay)
            {
                throw new InvalidOperationException("No se puede modificar un horario que ya terminó hoy.");
            }
        }

        if (dto.Activo)
        {
            if (dto.Fecha.Date < DateTime.Now.Date)
            {
                throw new InvalidOperationException("No se puede activar un horario de una fecha pasada.");
            }

            if (dto.Fecha.Date == DateTime.Now.Date && dto.HoraFin <= DateTime.Now.TimeOfDay)
            {
                throw new InvalidOperationException("No se puede activar un horario que ya terminó hoy.");
            }

            var existeSolapamiento = await _repository.ExisteSolapamientoAsync(horario.MedicoId, dto.Fecha, dto.HoraInicio, dto.HoraFin, id);
            if (existeSolapamiento)
            {
                throw new InvalidOperationException("El horario se solapa con otro horario activo del médico.");
            }
        }

        horario.Fecha = dto.Fecha;
        horario.HoraInicio = dto.HoraInicio;
        horario.HoraFin = dto.HoraFin;
        horario.CuposDisponibles = dto.CuposDisponibles;
        horario.Activo = dto.Activo;

        await _repository.ActualizarAsync(horario);

        return true;
    }

    public async Task<bool> DesactivarAsync(int id)
    {
        var horario = await _repository.ObtenerPorIdAsync(id);
        if (horario == null)
            return false;

        if (!horario.Activo)
            return true;

        horario.Activo = false;
        await _repository.ActualizarAsync(horario);

        return true;
    }

    public async Task<IReadOnlyList<HorarioMedicoDto>> ObtenerPorMedicoIdAsync(int medicoId)
    {
        var horarios = await _repository.ObtenerPorMedicoIdAsync(medicoId);
        return horarios.Select(MapearADto).ToList();
    }

    public async Task<HorarioMedicoDto> CrearMiHorarioAsync(int medicoId, CrearMiHorarioDto dto)
    {
        var medico = await _medicoRepository.ObtenerPorIdAsync(medicoId);
        if (medico == null || !medico.Activo)
        {
            throw new InvalidOperationException("Médico no válido o inactivo.");
        }

        if (dto.HoraFin <= dto.HoraInicio)
        {
            throw new InvalidOperationException("La hora de fin debe ser mayor que la hora de inicio.");
        }

        if (dto.CuposDisponibles <= 0)
        {
            throw new InvalidOperationException("Los cupos disponibles deben ser mayores que cero.");
        }

        if (dto.Fecha.Date < DateTime.Now.Date)
        {
            throw new InvalidOperationException("No se puede crear disponibilidad para una fecha pasada.");
        }

        // Corrección 2: si la fecha es hoy, la hora de fin ya debe ser futura
        if (dto.Fecha.Date == DateTime.Now.Date && dto.HoraFin <= DateTime.Now.TimeOfDay)
        {
            throw new InvalidOperationException("No se puede crear disponibilidad para un horario que ya terminó hoy.");
        }

        var existeSolapamiento = await _repository.ExisteSolapamientoAsync(medicoId, dto.Fecha, dto.HoraInicio, dto.HoraFin);
        if (existeSolapamiento)
        {
            throw new InvalidOperationException("El horario se solapa o duplica con otro horario activo.");
        }

        var horario = new HorarioMedico
        {
            MedicoId = medicoId,
            Fecha = dto.Fecha,
            HoraInicio = dto.HoraInicio,
            HoraFin = dto.HoraFin,
            CuposDisponibles = dto.CuposDisponibles,
            Activo = true
        };

        var horarioCreado = await _repository.CrearAsync(horario);
        var horarioConMedico = await _repository.ObtenerPorIdAsync(horarioCreado.Id);

        return MapearADto(horarioConMedico!);
    }

    public async Task<bool> ActualizarMiHorarioAsync(int id, int medicoId, ActualizarMiHorarioDto dto)
    {
        var horario = await _repository.ObtenerPorIdAsync(id);
        if (horario == null || horario.MedicoId != medicoId)
            return false;

        if (dto.HoraFin <= dto.HoraInicio)
        {
            throw new InvalidOperationException("La hora de fin debe ser mayor que la hora de inicio.");
        }

        if (dto.CuposDisponibles <= 0)
        {
            throw new InvalidOperationException("Los cupos disponibles deben ser mayores que cero.");
        }

        if (dto.Fecha.Date < DateTime.Now.Date)
        {
            throw new InvalidOperationException("No se puede modificar una disponibilidad para una fecha pasada.");
        }

        // Corrección 2: si la fecha es hoy, la hora de fin ya debe ser futura (aplica también al reactivar)
        if (dto.Fecha.Date == DateTime.Now.Date && dto.HoraFin <= DateTime.Now.TimeOfDay)
        {
            throw new InvalidOperationException("No se puede modificar una disponibilidad para un horario que ya terminó hoy.");
        }

        var tieneCitas = await _repository.TieneCitasAsociadasAsync(id);
        if (tieneCitas)
        {
            // Corrección 1: bloquear Fecha, HoraInicio, HoraFin y CuposDisponibles cuando hay citas
            if (horario.Fecha != dto.Fecha || horario.HoraInicio != dto.HoraInicio || horario.HoraFin != dto.HoraFin)
            {
                throw new InvalidOperationException("Este horario ya tiene citas asociadas. Para proteger las reservas, no es posible cambiar su fecha u horas.");
            }

            if (horario.CuposDisponibles != dto.CuposDisponibles)
            {
                throw new InvalidOperationException("Este horario ya tiene citas asociadas. Los cupos disponibles no pueden modificarse manualmente porque se gestionan automáticamente al reservar o cancelar citas.");
            }
        }
        else
        {
            if (dto.Activo)
            {
                var existeSolapamiento = await _repository.ExisteSolapamientoAsync(medicoId, dto.Fecha, dto.HoraInicio, dto.HoraFin, id);
                if (existeSolapamiento)
                {
                    throw new InvalidOperationException("El horario se solapa con otro horario activo.");
                }
            }
        }

        horario.Fecha = dto.Fecha;
        horario.HoraInicio = dto.HoraInicio;
        horario.HoraFin = dto.HoraFin;
        horario.CuposDisponibles = dto.CuposDisponibles;
        horario.Activo = dto.Activo;

        await _repository.ActualizarAsync(horario);

        return true;
    }

    public async Task<bool> DesactivarMiHorarioAsync(int id, int medicoId)
    {
        var horario = await _repository.ObtenerPorIdAsync(id);
        if (horario == null || horario.MedicoId != medicoId)
            return false;

        if (!horario.Activo)
            return true;

        horario.Activo = false;
        await _repository.ActualizarAsync(horario);

        return true;
    }

    private static HorarioMedicoDto MapearADto(HorarioMedico horario)
    {
        return new HorarioMedicoDto
        {
            Id = horario.Id,
            MedicoId = horario.MedicoId,
            MedicoNombre = $"{horario.Medico.Nombres} {horario.Medico.Apellidos}",
            Fecha = horario.Fecha,
            HoraInicio = horario.HoraInicio,
            HoraFin = horario.HoraFin,
            CuposDisponibles = horario.CuposDisponibles,
            Activo = horario.Activo,
            TieneCitas = horario.Citas != null && horario.Citas.Any()
        };
    }
}
