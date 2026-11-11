using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaClinica.Application.DTOs.AtencionesMedicas;
using SistemaClinica.Application.Interfaces.Services;

namespace SistemaClinica.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Medico")]
public class AtencionesMedicasController : ControllerBase
{
    private readonly IAtencionMedicaService _atencionMedicaService;

    public AtencionesMedicasController(IAtencionMedicaService atencionMedicaService)
    {
        _atencionMedicaService = atencionMedicaService;
    }

    // GET /api/AtencionesMedicas
    // Solo devuelve las atenciones del médico autenticado (por Claims)
    [HttpGet]
    public async Task<IActionResult> ObtenerTodas()
    {
        var medicoIdStr = User.FindFirstValue("MedicoId");
        if (!int.TryParse(medicoIdStr, out var medicoId))
            return Forbid();

        var todas = await _atencionMedicaService.ObtenerTodasAsync();
        var propias = todas.Where(a => a.MedicoId == medicoId).ToList();
        return Ok(propias);
    }

    // GET /api/AtencionesMedicas/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var atencion = await _atencionMedicaService.ObtenerPorIdAsync(id);

        if (atencion == null)
            return NotFound(new { mensaje = "Atención médica no encontrada." });

        return Ok(atencion);
    }

    // GET /api/AtencionesMedicas/cita/{citaId}
    // Solo permite consultar si la atención pertenece al médico autenticado
    [HttpGet("cita/{citaId}")]
    public async Task<IActionResult> ObtenerPorCitaId(int citaId)
    {
        var medicoIdStr = User.FindFirstValue("MedicoId");
        if (!int.TryParse(medicoIdStr, out var medicoId))
            return Forbid();

        var atencion = await _atencionMedicaService.ObtenerPorCitaIdAsync(citaId);

        if (atencion == null)
            return NotFound(new { mensaje = "Atención médica no encontrada para la cita indicada." });

        if (atencion.MedicoId != medicoId)
            return Forbid();

        return Ok(atencion);
    }

    // POST /api/AtencionesMedicas
    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearAtencionMedicaDto dto)
    {
        var medicoIdStr = User.FindFirstValue("MedicoId");
        if (!int.TryParse(medicoIdStr, out var medicoId))
            return Forbid();

        // Inyectar MedicoId desde Claims, no confiar en el cliente
        dto.MedicoId = medicoId;

        try
        {
            var atencionCreada = await _atencionMedicaService.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = atencionCreada.Id }, atencionCreada);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }
}
