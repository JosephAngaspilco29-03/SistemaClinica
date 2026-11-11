using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.AtencionesMedicas;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Application.Interfaces.Services;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Services;

public class AtencionMedicaService : IAtencionMedicaService
{
    private readonly IAtencionMedicaRepository _atencionRepository;
    private readonly ICitaRepository _citaRepository;
    private readonly ITriajeRepository _triajeRepository;

    public AtencionMedicaService(
        IAtencionMedicaRepository atencionRepository,
        ICitaRepository citaRepository,
        ITriajeRepository triajeRepository)
    {
        _atencionRepository = atencionRepository;
        _citaRepository = citaRepository;
        _triajeRepository = triajeRepository;
    }

    public async Task<IReadOnlyList<AtencionMedicaDto>> ObtenerTodasAsync()
    {
        var atenciones = await _atencionRepository.ObtenerTodasAsync();
        return atenciones.Select(MapearADto).ToList();
    }

    public async Task<AtencionMedicaDto?> ObtenerPorIdAsync(int id)
    {
        var atencion = await _atencionRepository.ObtenerPorIdAsync(id);

        if (atencion == null)
            return null;

        return MapearADto(atencion);
    }

    public async Task<AtencionMedicaDto?> ObtenerPorCitaIdAsync(int citaId)
    {
        var atencion = await _atencionRepository.ObtenerPorCitaIdAsync(citaId);

        if (atencion == null)
            return null;

        return MapearADto(atencion);
    }

    public async Task<AtencionMedicaDto> CrearAsync(CrearAtencionMedicaDto dto)
    {
        // Validar cita
        var cita = await _citaRepository.ObtenerPorIdAsync(dto.CitaId);
        if (cita == null)
            throw new InvalidOperationException($"La cita con Id {dto.CitaId} no existe.");

        if (cita.Estado == "Cancelada")
            throw new InvalidOperationException("No se puede registrar atención médica para una cita cancelada.");

        if (cita.Estado == "Atendida")
            throw new InvalidOperationException("La cita ya fue atendida.");

        // Validar ownership: la cita debe pertenecer al médico del DTO
        if (cita.MedicoId != dto.MedicoId)
            throw new InvalidOperationException("No tiene permiso para registrar atención en esta cita.");

        // Validar que la cita sea del día actual
        if (cita.FechaHora.Date != DateTime.Now.Date)
            throw new InvalidOperationException("La atención médica solo puede registrarse el día de la cita.");

        // Validar que exista triaje
        var triaje = await _triajeRepository.ObtenerPorCitaIdAsync(dto.CitaId);
        if (triaje == null)
            throw new InvalidOperationException("La cita debe tener un triaje registrado antes de la atención médica.");

        // Validar que no exista ya una atención
        var atencionExistente = await _atencionRepository.ObtenerPorCitaIdAsync(dto.CitaId);
        if (atencionExistente != null)
            throw new InvalidOperationException("La cita ya tiene una atención médica registrada.");

        // Validar diagnósticos
        if (dto.Diagnosticos.Count == 0)
            throw new InvalidOperationException("Debe registrar al menos un diagnóstico.");

        // Validar exactamente un diagnóstico principal
        var cantidadPrincipales = dto.Diagnosticos.Count(d => d.Principal);
        if (cantidadPrincipales == 0)
            throw new InvalidOperationException("Debe indicar exactamente un diagnóstico como principal.");
        if (cantidadPrincipales > 1)
            throw new InvalidOperationException("Solo puede existir un diagnóstico principal.");

        foreach (var diagnosticoDto in dto.Diagnosticos)
        {
            if (string.IsNullOrWhiteSpace(diagnosticoDto.CodigoCie10))
                throw new InvalidOperationException("El código CIE-10 del diagnóstico es obligatorio.");

            if (string.IsNullOrWhiteSpace(diagnosticoDto.Descripcion))
                throw new InvalidOperationException("La descripción del diagnóstico es obligatoria.");
        }

        // Crear atención con datos de la cita
        var atencion = new AtencionMedica
        {
            CitaId = cita.Id,
            MedicoId = cita.MedicoId,
            PacienteId = cita.PacienteId,
            FechaAtencion = DateTime.Now,
            MotivoConsulta = cita.MotivoConsulta,
            Anamnesis = dto.Anamnesis,
            ExamenFisico = dto.ExamenFisico,
            Indicaciones = dto.Indicaciones,
            Observaciones = dto.Observaciones
        };

        // Agregar diagnósticos
        foreach (var diagnosticoDto in dto.Diagnosticos)
        {
            atencion.Diagnosticos.Add(new Diagnostico
            {
                CodigoCie10 = diagnosticoDto.CodigoCie10,
                Descripcion = diagnosticoDto.Descripcion,
                Principal = diagnosticoDto.Principal
            });
        }

        // Cambiar estado de la cita (ya rastreada por el mismo DbContext)
        cita.Estado = "Atendida";

        // Un único SaveChangesAsync persiste: nueva AtencionMedica + Diagnosticos + Cita.Estado
        var atencionCreada = await _atencionRepository.CrearAsync(atencion);

        // Obtener con navegaciones cargadas para el mapeo
        var atencionConNavegaciones = await _atencionRepository.ObtenerPorIdAsync(atencionCreada.Id);

        return MapearADto(atencionConNavegaciones!);
    }

    private static AtencionMedicaDto MapearADto(AtencionMedica atencion)
    {
        return new AtencionMedicaDto
        {
            Id = atencion.Id,
            CitaId = atencion.CitaId,
            PacienteId = atencion.PacienteId,
            PacienteNombre = $"{atencion.Paciente.Nombres} {atencion.Paciente.Apellidos}",
            MedicoId = atencion.MedicoId,
            MedicoNombre = $"{atencion.Medico.Nombres} {atencion.Medico.Apellidos}",
            FechaAtencion = atencion.FechaAtencion,
            MotivoConsulta = atencion.MotivoConsulta,
            Anamnesis = atencion.Anamnesis,
            ExamenFisico = atencion.ExamenFisico,
            Indicaciones = atencion.Indicaciones,
            Observaciones = atencion.Observaciones,
            Diagnosticos = atencion.Diagnosticos
                .Select(d => new DiagnosticoDto
                {
                    Id = d.Id,
                    CodigoCie10 = d.CodigoCie10,
                    Descripcion = d.Descripcion,
                    Principal = d.Principal
                })
                .OrderByDescending(d => d.Principal)
                .ThenBy(d => d.CodigoCie10)
                .ToList()
        };
    }
}
