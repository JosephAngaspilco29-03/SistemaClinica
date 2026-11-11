using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaClinica.Application.DTOs.Pacientes;
using SistemaClinica.Application.Interfaces.Services;

namespace SistemaClinica.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class PacientesController : ControllerBase
{
    private readonly IPacienteService _pacienteService;

    public PacientesController(IPacienteService pacienteService)
    {
        _pacienteService = pacienteService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PacienteDto>>> ObtenerTodos()
    {
        var resultado = await _pacienteService.ObtenerTodosAsync();
        return Ok(resultado);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PacienteDto>> ObtenerPorId(int id)
    {
        var paciente = await _pacienteService.ObtenerPorIdAsync(id);

        if (paciente == null)
        {
            return NotFound(new { mensaje = "Paciente no encontrado." });
        }

        return Ok(paciente);
    }

    [HttpPost]
    public async Task<ActionResult<PacienteDto>> Crear([FromBody] CrearPacienteDto dto)
    {
        try
        {
            var paciente = await _pacienteService.CrearAsync(dto);
            return CreatedAtAction(
                nameof(ObtenerPorId),
                new { id = paciente.Id },
                paciente
            );
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarPacienteDto dto)
    {
        var resultado = await _pacienteService.ActualizarAsync(id, dto);

        if (!resultado)
        {
            return NotFound(new { mensaje = "Paciente no encontrado." });
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var resultado = await _pacienteService.DesactivarAsync(id);

        if (!resultado)
        {
            return NotFound(new { mensaje = "Paciente no encontrado." });
        }

        return NoContent();
    }
}
