using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaClinica.Application.DTOs.HorariosMedicos;
using SistemaClinica.Application.Interfaces.Services;

namespace SistemaClinica.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HorariosMedicosController : ControllerBase
{
    private readonly IHorarioMedicoService _horarioMedicoService;

    public HorariosMedicosController(IHorarioMedicoService horarioMedicoService)
    {
        _horarioMedicoService = horarioMedicoService;
    }

    // GET /api/HorariosMedicos
    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        var resultado = await _horarioMedicoService.ObtenerTodosAsync();
        return Ok(resultado);
    }

    // GET /api/HorariosMedicos/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var horario = await _horarioMedicoService.ObtenerPorIdAsync(id);

        if (horario == null)
            return NotFound(new { mensaje = "Horario médico no encontrado." });

        return Ok(horario);
    }

    // POST /api/HorariosMedicos
    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear([FromBody] CrearHorarioMedicoDto dto)
    {
        try
        {
            var horarioCreado = await _horarioMedicoService.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = horarioCreado.Id }, horarioCreado);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    // PUT /api/HorariosMedicos/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarHorarioMedicoDto dto)
    {
        try
        {
            var actualizado = await _horarioMedicoService.ActualizarAsync(id, dto);

            if (!actualizado)
                return NotFound(new { mensaje = "Horario médico no encontrado." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    // DELETE /api/HorariosMedicos/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var desactivado = await _horarioMedicoService.DesactivarAsync(id);

        if (!desactivado)
            return NotFound(new { mensaje = "Horario médico no encontrado." });

        return NoContent();
    }

    // GET /api/HorariosMedicos/mis-horarios
    [HttpGet("mis-horarios")]
    [Authorize(Roles = "Medico")]
    public async Task<IActionResult> ObtenerMisHorarios()
    {
        var medicoIdStr = User.FindFirstValue("MedicoId");
        if (!int.TryParse(medicoIdStr, out var medicoId)) return Forbid();

        var resultado = await _horarioMedicoService.ObtenerPorMedicoIdAsync(medicoId);
        return Ok(resultado);
    }

    // POST /api/HorariosMedicos/mis-horarios
    [HttpPost("mis-horarios")]
    [Authorize(Roles = "Medico")]
    public async Task<IActionResult> CrearMiHorario([FromBody] CrearMiHorarioDto dto)
    {
        var medicoIdStr = User.FindFirstValue("MedicoId");
        if (!int.TryParse(medicoIdStr, out var medicoId)) return Forbid();

        try
        {
            var horarioCreado = await _horarioMedicoService.CrearMiHorarioAsync(medicoId, dto);
            return Ok(horarioCreado); // Use Ok to avoid Location header routing issues for now
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    // PUT /api/HorariosMedicos/mis-horarios/{id}
    [HttpPut("mis-horarios/{id}")]
    [Authorize(Roles = "Medico")]
    public async Task<IActionResult> ActualizarMiHorario(int id, [FromBody] ActualizarMiHorarioDto dto)
    {
        var medicoIdStr = User.FindFirstValue("MedicoId");
        if (!int.TryParse(medicoIdStr, out var medicoId)) return Forbid();

        try
        {
            var actualizado = await _horarioMedicoService.ActualizarMiHorarioAsync(id, medicoId, dto);

            if (!actualizado)
                return NotFound(new { mensaje = "Horario médico no encontrado o no te pertenece." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    // DELETE /api/HorariosMedicos/mis-horarios/{id}
    [HttpDelete("mis-horarios/{id}")]
    [Authorize(Roles = "Medico")]
    public async Task<IActionResult> DesactivarMiHorario(int id)
    {
        var medicoIdStr = User.FindFirstValue("MedicoId");
        if (!int.TryParse(medicoIdStr, out var medicoId)) return Forbid();

        var desactivado = await _horarioMedicoService.DesactivarMiHorarioAsync(id, medicoId);

        if (!desactivado)
            return NotFound(new { mensaje = "Horario médico no encontrado o no te pertenece." });

        return NoContent();
    }
}
