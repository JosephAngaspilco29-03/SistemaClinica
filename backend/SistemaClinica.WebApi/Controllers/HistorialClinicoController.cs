using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaClinica.Application.Interfaces.Services;

namespace SistemaClinica.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HistorialClinicoController : ControllerBase
{
    private readonly IHistorialClinicoService _historialClinicoService;

    public HistorialClinicoController(IHistorialClinicoService historialClinicoService)
    {
        _historialClinicoService = historialClinicoService;
    }

    // ── GET /api/HistorialClinico/paciente/{pacienteId} ───────────────────────
    // Paciente: solo puede ver su propio historial.
    // Médico: solo puede ver pacientes vinculados a sus citas (validado en servicio).
    [HttpGet("paciente/{pacienteId:int}")]
    [Authorize(Roles = "Paciente,Medico")]
    public async Task<IActionResult> ObtenerPorPacienteId(int pacienteId)
    {
        var rol = User.FindFirstValue(ClaimTypes.Role);

        if (rol == "Paciente")
        {
            // El paciente solo ve su propio historial
            var pacienteIdStr = User.FindFirstValue("PacienteId");
            if (!int.TryParse(pacienteIdStr, out var idClaim) || idClaim != pacienteId)
                return Forbid();

            var historial = await _historialClinicoService.ObtenerPorPacienteIdAsync(pacienteId);
            if (historial == null)
                return NotFound(new { mensaje = "Paciente no encontrado." });

            return Ok(historial);
        }
        else // Medico
        {
            var medicoIdStr = User.FindFirstValue("MedicoId");
            if (!int.TryParse(medicoIdStr, out var medicoId))
                return Forbid();

            try
            {
                var historial = await _historialClinicoService
                    .ObtenerPorPacienteIdParaMedicoAsync(pacienteId, medicoId);

                if (historial == null)
                    return NotFound(new { mensaje = "Paciente no encontrado." });

                return Ok(historial);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }
    }

    // ── GET /api/HistorialClinico/mis-pacientes ───────────────────────────────
    // Retorna la lista de pacientes que tienen al menos una cita con el médico autenticado.
    [HttpGet("mis-pacientes")]
    [Authorize(Roles = "Medico")]
    public async Task<IActionResult> MisPacientes()
    {
        var medicoIdStr = User.FindFirstValue("MedicoId");
        if (!int.TryParse(medicoIdStr, out var medicoId))
            return Forbid();

        var pacientes = await _historialClinicoService.ObtenerPacientesDelMedicoAsync(medicoId);
        return Ok(pacientes);
    }
}
