using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaClinica.Application.DTOs.Triajes;
using SistemaClinica.Application.Interfaces.Services;

namespace SistemaClinica.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TriajesController : ControllerBase
{
    private readonly ITriajeService _triajeService;

    public TriajesController(ITriajeService triajeService)
    {
        _triajeService = triajeService;
    }

    // GET /api/Triajes
    [HttpGet]
    [Authorize(Roles = "Enfermero,Medico")]
    public async Task<IActionResult> ObtenerTodos()
    {
        var resultado = await _triajeService.ObtenerTodosAsync();
        return Ok(resultado);
    }

    // GET /api/Triajes/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "Enfermero,Medico")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var triaje = await _triajeService.ObtenerPorIdAsync(id);

        if (triaje == null)
            return NotFound(new { mensaje = "Triaje no encontrado." });

        return Ok(triaje);
    }

    // GET /api/Triajes/cita/{citaId}
    [HttpGet("cita/{citaId}")]
    [Authorize(Roles = "Enfermero,Medico")]
    public async Task<IActionResult> ObtenerPorCitaId(int citaId)
    {
        var triaje = await _triajeService.ObtenerPorCitaIdAsync(citaId);

        if (triaje == null)
            return NotFound(new { mensaje = "Triaje no encontrado para la cita indicada." });

        return Ok(triaje);
    }

    // POST /api/Triajes
    [HttpPost]
    [Authorize(Roles = "Enfermero")]
    public async Task<IActionResult> Crear([FromBody] CrearTriajeDto dto)
    {
        try
        {
            var triajeCreado = await _triajeService.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = triajeCreado.Id }, triajeCreado);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    // PUT /api/Triajes/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Enfermero")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarTriajeDto dto)
    {
        try
        {
            var actualizado = await _triajeService.ActualizarAsync(id, dto);

            if (!actualizado)
                return NotFound(new { mensaje = "Triaje no encontrado." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }
}
