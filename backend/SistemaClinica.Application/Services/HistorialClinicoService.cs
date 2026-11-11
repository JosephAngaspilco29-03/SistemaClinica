using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.HistorialClinico;
using SistemaClinica.Application.DTOs.Pacientes;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Application.Interfaces.Services;

namespace SistemaClinica.Application.Services;

public class HistorialClinicoService : IHistorialClinicoService
{
    private readonly IPacienteRepository _pacienteRepository;
    private readonly IAtencionMedicaRepository _atencionMedicaRepository;
    private readonly ICitaRepository _citaRepository;

    public HistorialClinicoService(
        IPacienteRepository pacienteRepository,
        IAtencionMedicaRepository atencionMedicaRepository,
        ICitaRepository citaRepository)
    {
        _pacienteRepository = pacienteRepository;
        _atencionMedicaRepository = atencionMedicaRepository;
        _citaRepository = citaRepository;
    }

    // ── Uso por Paciente (ve su propio historial) ─────────────────────────────
    public async Task<HistorialClinicoDto?> ObtenerPorPacienteIdAsync(int pacienteId)
    {
        var paciente = await _pacienteRepository.ObtenerPorIdAsync(pacienteId);
        if (paciente == null) return null;

        var todasLasAtenciones = await _atencionMedicaRepository.ObtenerTodasAsync();
        var atencionesDelPaciente = todasLasAtenciones
            .Where(a => a.PacienteId == pacienteId)
            .OrderByDescending(a => a.FechaAtencion)
            .Select(MapearAtencion)
            .ToList();

        return BuildHistorial(paciente, atencionesDelPaciente);
    }

    // ── Uso por Médico (solo puede ver pacientes vinculados a sus citas) ───────
    public async Task<HistorialClinicoDto?> ObtenerPorPacienteIdParaMedicoAsync(
        int pacienteId, int medicoId)
    {
        var paciente = await _pacienteRepository.ObtenerPorIdAsync(pacienteId);
        if (paciente == null) return null;

        // Verificar en base de datos que el médico tenga al menos una cita con el paciente
        var todasLasCitas = await _citaRepository.ObtenerTodasAsync();
        var tieneCita = todasLasCitas.Any(c => c.MedicoId == medicoId && c.PacienteId == pacienteId);

        if (!tieneCita)
            throw new UnauthorizedAccessException(
                "El médico no tiene citas registradas con este paciente.");

        // Obtener TODAS las atenciones del paciente (historial completo, no solo las de este médico)
        var todasLasAtenciones = await _atencionMedicaRepository.ObtenerTodasAsync();
        var atencionesDelPaciente = todasLasAtenciones
            .Where(a => a.PacienteId == pacienteId)
            .OrderByDescending(a => a.FechaAtencion)
            .Select(MapearAtencion)
            .ToList();

        return BuildHistorial(paciente, atencionesDelPaciente);
    }

    // ── Lista de pacientes del médico ─────────────────────────────────────────
    public async Task<IReadOnlyList<PacienteResumenDto>> ObtenerPacientesDelMedicoAsync(int medicoId)
    {
        var todasLasCitas = await _citaRepository.ObtenerTodasAsync();

        var pacientes = todasLasCitas
            .Where(c => c.MedicoId == medicoId)
            .Select(c => c.Paciente)
            .DistinctBy(p => p.Id)
            .OrderBy(p => p.Apellidos)
            .ThenBy(p => p.Nombres)
            .Select(p => new PacienteResumenDto
            {
                Id = p.Id,
                NombreCompleto = $"{p.Nombres} {p.Apellidos}",
                DocumentoIdentidad = p.DocumentoIdentidad
            })
            .ToList();

        return pacientes;
    }

    // ── Helpers privados ──────────────────────────────────────────────────────
    private static HistorialClinicoDto BuildHistorial(
        SistemaClinica.Domain.Entities.Paciente paciente,
        IReadOnlyList<HistorialAtencionDto> atenciones)
    {
        return new HistorialClinicoDto
        {
            PacienteId = paciente.Id,
            PacienteNombre = $"{paciente.Nombres} {paciente.Apellidos}",
            DocumentoIdentidad = paciente.DocumentoIdentidad,
            FechaNacimiento = paciente.FechaNacimiento,
            Sexo = paciente.Sexo,
            Atenciones = atenciones
        };
    }

    private static HistorialAtencionDto MapearAtencion(
        SistemaClinica.Domain.Entities.AtencionMedica a)
    {
        // El triaje viene navegado desde la Cita (Cita.Triaje)
        HistorialTriajeDto? triajeDto = null;
        if (a.Cita?.Triaje != null)
        {
            var t = a.Cita.Triaje;
            triajeDto = new HistorialTriajeDto
            {
                PresionSistolica = t.PresionSistolica,
                PresionDiastolica = t.PresionDiastolica,
                Temperatura = t.Temperatura,
                FrecuenciaCardiaca = t.FrecuenciaCardiaca,
                Peso = t.Peso,
                Talla = t.Talla,
                Imc = t.Imc,
                FechaRegistro = t.FechaRegistro,
                Observaciones = t.Observaciones
            };
        }

        return new HistorialAtencionDto
        {
            AtencionMedicaId = a.Id,
            CitaId = a.CitaId,
            FechaAtencion = a.FechaAtencion,
            MedicoId = a.MedicoId,
            MedicoNombre = $"{a.Medico.Nombres} {a.Medico.Apellidos}",
            EspecialidadNombre = a.Cita?.Especialidad?.Nombre ?? string.Empty,
            MotivoConsulta = a.MotivoConsulta,
            Anamnesis = a.Anamnesis,
            ExamenFisico = a.ExamenFisico,
            Indicaciones = a.Indicaciones,
            Observaciones = a.Observaciones,
            Triaje = triajeDto,
            Diagnosticos = a.Diagnosticos
                .OrderByDescending(d => d.Principal)
                .ThenBy(d => d.CodigoCie10)
                .Select(d => new HistorialDiagnosticoDto
                {
                    Id = d.Id,
                    CodigoCie10 = d.CodigoCie10,
                    Descripcion = d.Descripcion,
                    Principal = d.Principal
                })
                .ToList()
        };
    }
}
