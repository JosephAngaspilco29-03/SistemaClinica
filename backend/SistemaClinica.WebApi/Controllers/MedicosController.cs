using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaClinica.Application.DTOs.Medicos;
using SistemaClinica.Application.Interfaces.Services;

namespace SistemaClinica.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MedicosController : ControllerBase
{
    private readonly IMedicoService _medicoService;

    public MedicosController(IMedicoService medicoService)
    {
        _medicoService = medicoService;
    }

    // GET /api/Medicos
    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        var resultado = await _medicoService.ObtenerTodosAsync();
        return Ok(resultado);
    }

    // GET /api/Medicos/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var medico = await _medicoService.ObtenerPorIdAsync(id);

        if (medico == null)
            return NotFound(new { mensaje = "Médico no encontrado." });

        return Ok(medico);
    }

    // POST /api/Medicos
    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear([FromBody] CrearMedicoDto dto)
    {
        try
        {
            var medicoCreado = await _medicoService.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = medicoCreado.Id }, medicoCreado);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    // PUT /api/Medicos/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarMedicoDto dto)
    {
        try
        {
            var actualizado = await _medicoService.ActualizarAsync(id, dto);

            if (!actualizado)
                return NotFound(new { mensaje = "Médico no encontrado." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    // DELETE /api/Medicos/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var desactivado = await _medicoService.DesactivarAsync(id);

        if (!desactivado)
            return NotFound(new { mensaje = "Médico no encontrado." });

        return NoContent();
    }
}
