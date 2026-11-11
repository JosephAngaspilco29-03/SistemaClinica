using System;
using System.Linq;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Reportes;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Application.Interfaces.Services;

namespace SistemaClinica.Application.Services;

public class ReporteService : IReporteService
{
    private readonly IAtencionMedicaRepository _atencionMedicaRepository;
    private readonly ICitaRepository _citaRepository;

    public ReporteService(
        IAtencionMedicaRepository atencionMedicaRepository,
        ICitaRepository citaRepository)
    {
        _atencionMedicaRepository = atencionMedicaRepository;
        _citaRepository = citaRepository;
    }

    public async Task<ReporteAtencionesDto> ObtenerReporteAtencionesAsync()
    {
        var atenciones = await _atencionMedicaRepository.ObtenerTodasAsync();
        
        var atencionesOrdenadas = atenciones.OrderByDescending(a => a.FechaAtencion).ToList();

        var items = atencionesOrdenadas.Select(a =>
        {
            var diagnosticoPrincipal = a.Diagnosticos.FirstOrDefault(d => d.Principal);
            var diagnosticoStr = diagnosticoPrincipal != null 
                ? $"{diagnosticoPrincipal.CodigoCie10} - {diagnosticoPrincipal.Descripcion}" 
                : string.Empty;

            return new ReporteAtencionItemDto
            {
                AtencionMedicaId = a.Id,
                CitaId = a.CitaId,
                FechaAtencion = a.FechaAtencion,
                PacienteId = a.PacienteId,
                PacienteNombre = $"{a.Paciente.Nombres} {a.Paciente.Apellidos}",
                MedicoId = a.MedicoId,
                MedicoNombre = $"{a.Medico.Nombres} {a.Medico.Apellidos}",
                MotivoConsulta = a.MotivoConsulta,
                DiagnosticoPrincipal = diagnosticoStr
            };
        }).ToList();

        return new ReporteAtencionesDto
        {
            TotalAtenciones = items.Count,
            Atenciones = items
        };
    }

    public async Task<ReporteAusentismoDto> ObtenerReporteAusentismoAsync()
    {
        var citas = await _citaRepository.ObtenerTodasAsync();

        int totalCitas = citas.Count;
        int totalAtendidas = citas.Count(c => c.Estado == "Atendida");
        int totalCanceladas = citas.Count(c => c.Estado == "Cancelada");
        int totalAusentes = citas.Count(c => c.Estado == "Ausente");

        decimal porcentajeAusentismo = 0;
        int citasConsideradas = totalAtendidas + totalAusentes;
        
        if (citasConsideradas > 0)
        {
            decimal calculo = (decimal)totalAusentes * 100m / citasConsideradas;
            porcentajeAusentismo = Math.Round(calculo, 2, MidpointRounding.AwayFromZero);
        }

        return new ReporteAusentismoDto
        {
            TotalCitas = totalCitas,
            TotalAtendidas = totalAtendidas,
            TotalCanceladas = totalCanceladas,
            TotalAusentes = totalAusentes,
            PorcentajeAusentismo = porcentajeAusentismo
        };
    }
}
