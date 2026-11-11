using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Citas;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Application.Interfaces.Services;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Services;

public class CitaService : ICitaService
{
    private readonly ICitaRepository _citaRepository;
    private readonly IPacienteRepository _pacienteRepository;
    private readonly IMedicoRepository _medicoRepository;
    private readonly IEspecialidadRepository _especialidadRepository;
    private readonly IHorarioMedicoRepository _horarioMedicoRepository;

    public CitaService(
        ICitaRepository citaRepository,
        IPacienteRepository pacienteRepository,
        IMedicoRepository medicoRepository,
        IEspecialidadRepository especialidadRepository,
        IHorarioMedicoRepository horarioMedicoRepository)
    {
        _citaRepository = citaRepository;
        _pacienteRepository = pacienteRepository;
        _medicoRepository = medicoRepository;
        _especialidadRepository = especialidadRepository;
        _horarioMedicoRepository = horarioMedicoRepository;
    }

    public async Task<IReadOnlyList<CitaDto>> ObtenerTodasAsync()
    {
        var citas = await _citaRepository.ObtenerTodasAsync();
        return citas.Select(MapearADto).ToList();
    }

    public async Task<CitaDto?> ObtenerPorIdAsync(int id)
    {
        var cita = await _citaRepository.ObtenerPorIdAsync(id);

        if (cita == null)
            return null;

        return MapearADto(cita);
    }

    public async Task<CitaDto> CrearAsync(CrearCitaDto dto)
    {
        // Validar paciente
        var paciente = await _pacienteRepository.ObtenerPorIdAsync(dto.PacienteId);
        if (paciente == null)
            throw new InvalidOperationException($"El paciente con Id {dto.PacienteId} no existe.");

        if (!paciente.Activo)
            throw new InvalidOperationException("No se puede registrar una cita para un paciente inactivo.");

        // Validar médico
        var medico = await _medicoRepository.ObtenerPorIdAsync(dto.MedicoId);
        if (medico == null)
            throw new InvalidOperationException($"El médico con Id {dto.MedicoId} no existe.");

        if (!medico.Activo)
            throw new InvalidOperationException("No se puede registrar una cita con un médico inactivo.");

        // Validar especialidad
        var especialidad = await _especialidadRepository.ObtenerPorIdAsync(dto.EspecialidadId);
        if (especialidad == null)
            throw new InvalidOperationException($"La especialidad con Id {dto.EspecialidadId} no existe.");

        if (!especialidad.Activo)
            throw new InvalidOperationException("No se puede registrar una cita con una especialidad inactiva.");

        var medicoTieneEspecialidad = medico.MedicoEspecialidades
            .Any(me => me.EspecialidadId == dto.EspecialidadId);

        if (!medicoTieneEspecialidad)
            throw new InvalidOperationException("El médico seleccionado no pertenece a la especialidad indicada.");

        // Validar horario
        var horario = await _horarioMedicoRepository.ObtenerPorIdAsync(dto.HorarioMedicoId);
        if (horario == null)
            throw new InvalidOperationException($"El horario médico con Id {dto.HorarioMedicoId} no existe.");

        if (!horario.Activo)
            throw new InvalidOperationException("El horario seleccionado se encuentra inactivo.");

        if (horario.MedicoId != dto.MedicoId)
            throw new InvalidOperationException("El horario seleccionado no pertenece al médico indicado.");

        if (horario.CuposDisponibles <= 0)
            throw new InvalidOperationException("El horario seleccionado no tiene cupos disponibles.");

        // Disminuir cupo antes de guardar
        horario.CuposDisponibles -= 1;

        // Crear cita
        var cita = new Cita
        {
            PacienteId = dto.PacienteId,
            MedicoId = dto.MedicoId,
            EspecialidadId = dto.EspecialidadId,
            HorarioMedicoId = dto.HorarioMedicoId,
            FechaHora = horario.Fecha.Date.Add(horario.HoraInicio),
            MotivoConsulta = dto.MotivoConsulta,
            Estado = "Reservada",
            FechaRegistro = DateTime.Now
        };

        // SaveChangesAsync persiste la nueva cita y la disminución de cupos en una sola operación
        var citaCreada = await _citaRepository.CrearAsync(cita);

        // Volver a obtener con navegaciones cargadas
        var citaConNavegaciones = await _citaRepository.ObtenerPorIdAsync(citaCreada.Id);

        return MapearADto(citaConNavegaciones!);
    }

    public async Task<bool> ReprogramarAsync(int id, ReprogramarCitaDto dto)
    {
        var cita = await _citaRepository.ObtenerPorIdAsync(id);
        if (cita == null)
            return false;

        if (cita.Estado == "Cancelada")
            throw new InvalidOperationException("No se puede reprogramar una cita cancelada.");

        if (cita.Estado == "Atendida")
            throw new InvalidOperationException("No se puede reprogramar una cita atendida.");

        // Mismo horario: no se hace nada
        if (dto.HorarioMedicoId == cita.HorarioMedicoId)
            return true;

        // Validar nuevo horario
        var nuevoHorario = await _horarioMedicoRepository.ObtenerPorIdAsync(dto.HorarioMedicoId);
        if (nuevoHorario == null)
            throw new InvalidOperationException($"El horario médico con Id {dto.HorarioMedicoId} no existe.");

        if (!nuevoHorario.Activo)
            throw new InvalidOperationException("El nuevo horario se encuentra inactivo.");

        if (nuevoHorario.MedicoId != cita.MedicoId)
            throw new InvalidOperationException("El nuevo horario no pertenece al médico de la cita.");

        if (nuevoHorario.CuposDisponibles <= 0)
            throw new InvalidOperationException("El nuevo horario no tiene cupos disponibles.");

        // Devolver cupo al horario anterior (ya rastreado via ObtenerPorIdAsync de la cita)
        cita.HorarioMedico.CuposDisponibles += 1;

        // Decrementar cupo del nuevo horario (ya rastreado via ObtenerPorIdAsync del nuevo horario)
        nuevoHorario.CuposDisponibles -= 1;

        // Actualizar cita
        cita.HorarioMedicoId = nuevoHorario.Id;
        cita.FechaHora = nuevoHorario.Fecha.Date.Add(nuevoHorario.HoraInicio);
        cita.Estado = "Reprogramada";

        // Un único SaveChangesAsync persiste cita + ambos horarios
        await _citaRepository.ActualizarAsync(cita);

        return true;
    }

    public async Task<bool> CancelarAsync(int id)
    {
        var cita = await _citaRepository.ObtenerPorIdAsync(id);
        if (cita == null)
            return false;

        // Ya cancelada: no tocar cupos
        if (cita.Estado == "Cancelada")
            return true;

        if (cita.Estado == "Atendida")
            throw new InvalidOperationException("No se puede cancelar una cita atendida.");

        // Devolver cupo al horario (ya rastreado)
        cita.HorarioMedico.CuposDisponibles += 1;

        cita.Estado = "Cancelada";

        // Un único SaveChangesAsync persiste el estado y la devolución del cupo
        await _citaRepository.ActualizarAsync(cita);

        return true;
    }

    private static CitaDto MapearADto(Cita cita)
    {
        return new CitaDto
        {
            Id = cita.Id,
            PacienteId = cita.PacienteId,
            PacienteNombre = $"{cita.Paciente.Nombres} {cita.Paciente.Apellidos}",
            MedicoId = cita.MedicoId,
            MedicoNombre = $"{cita.Medico.Nombres} {cita.Medico.Apellidos}",
            EspecialidadId = cita.EspecialidadId,
            EspecialidadNombre = cita.Especialidad.Nombre,
            HorarioMedicoId = cita.HorarioMedicoId,
            FechaHora = cita.FechaHora,
            MotivoConsulta = cita.MotivoConsulta,
            Estado = cita.Estado,
            FechaRegistro = cita.FechaRegistro
        };
    }
}
