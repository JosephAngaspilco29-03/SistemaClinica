using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaClinica.Application.DTOs.Citas;
using SistemaClinica.Application.Interfaces.Services;

namespace SistemaClinica.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CitasController : ControllerBase
{
    private readonly ICitaService _citaService;

    public CitasController(ICitaService citaService)
    {
        _citaService = citaService;
    }

    // GET /api/Citas
    [HttpGet]
    [Authorize(Roles = "Administrador,Enfermero")]
    public async Task<IActionResult> ObtenerTodas()
    {
        var resultado = await _citaService.ObtenerTodasAsync();
        return Ok(resultado);
    }

    // GET /api/Citas/mis-citas
    [HttpGet("mis-citas")]
    [Authorize(Roles = "Paciente,Medico")]
    public async Task<IActionResult> MisCitas()
    {
        var todasLasCitas = await _citaService.ObtenerTodasAsync();
        var rol = User.FindFirstValue(ClaimTypes.Role);

        if (rol == "Paciente")
        {
            var pacienteIdStr = User.FindFirstValue("PacienteId");
            if (!int.TryParse(pacienteIdStr, out var pacienteId))
                return Forbid();

            var citasPaciente = todasLasCitas
                .Where(c => c.PacienteId == pacienteId)
                .ToList();

            return Ok(citasPaciente);
        }
        else // Medico
        {
            var medicoIdStr = User.FindFirstValue("MedicoId");
            if (!int.TryParse(medicoIdStr, out var medicoId))
                return Forbid();

            var citasMedico = todasLasCitas
                .Where(c => c.MedicoId == medicoId)
                .ToList();

            return Ok(citasMedico);
        }
    }

    // GET /api/Citas/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "Administrador,Enfermero,Medico,Paciente")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var cita = await _citaService.ObtenerPorIdAsync(id);

        if (cita == null)
            return NotFound(new { mensaje = "Cita no encontrada." });

        var rol = User.FindFirstValue(ClaimTypes.Role);

        if (rol == "Paciente")
        {
            var pacienteIdStr = User.FindFirstValue("PacienteId");
            if (!int.TryParse(pacienteIdStr, out var pacienteId) || cita.PacienteId != pacienteId)
                return Forbid();
        }
        else if (rol == "Medico")
        {
            var medicoIdStr = User.FindFirstValue("MedicoId");
            if (!int.TryParse(medicoIdStr, out var medicoId) || cita.MedicoId != medicoId)
                return Forbid();
        }

        return Ok(cita);
    }

    // POST /api/Citas
    [HttpPost]
    [Authorize(Roles = "Paciente")]
    public async Task<IActionResult> Crear([FromBody] CrearCitaDto dto)
    {
        var pacienteIdStr = User.FindFirstValue("PacienteId");
        if (!int.TryParse(pacienteIdStr, out var pacienteId) || dto.PacienteId != pacienteId)
            return Forbid();

        try
        {
            var citaCreada = await _citaService.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = citaCreada.Id }, citaCreada);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    // PUT /api/Citas/{id}/reprogramar
    [HttpPut("{id}/reprogramar")]
    [Authorize(Roles = "Paciente")]
    public async Task<IActionResult> Reprogramar(int id, [FromBody] ReprogramarCitaDto dto)
    {
        var cita = await _citaService.ObtenerPorIdAsync(id);

        if (cita == null)
            return NotFound(new { mensaje = "Cita no encontrada." });

        var pacienteIdStr = User.FindFirstValue("PacienteId");
        if (!int.TryParse(pacienteIdStr, out var pacienteId) || cita.PacienteId != pacienteId)
            return Forbid();

        try
        {
            var reprogramada = await _citaService.ReprogramarAsync(id, dto);

            if (!reprogramada)
                return NotFound(new { mensaje = "Cita no encontrada." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    // DELETE /api/Citas/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Paciente")]
    public async Task<IActionResult> Cancelar(int id)
    {
        var cita = await _citaService.ObtenerPorIdAsync(id);

        if (cita == null)
            return NotFound(new { mensaje = "Cita no encontrada." });

        var pacienteIdStr = User.FindFirstValue("PacienteId");
        if (!int.TryParse(pacienteIdStr, out var pacienteId) || cita.PacienteId != pacienteId)
            return Forbid();

        try
        {
            var cancelada = await _citaService.CancelarAsync(id);

            if (!cancelada)
                return NotFound(new { mensaje = "Cita no encontrada." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }
}
