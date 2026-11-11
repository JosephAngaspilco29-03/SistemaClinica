using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaClinica.Application.DTOs.Especialidades;
using SistemaClinica.Application.Interfaces.Services;

namespace SistemaClinica.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EspecialidadesController : ControllerBase
{
    private readonly IEspecialidadService _especialidadService;

    public EspecialidadesController(IEspecialidadService especialidadService)
    {
        _especialidadService = especialidadService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EspecialidadDto>>> ObtenerTodas()
    {
        var resultado = await _especialidadService.ObtenerTodasAsync();
        return Ok(resultado);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EspecialidadDto>> ObtenerPorId(int id)
    {
        var especialidad = await _especialidadService.ObtenerPorIdAsync(id);

        if (especialidad == null)
        {
            return NotFound(new { mensaje = "Especialidad no encontrada." });
        }

        return Ok(especialidad);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<EspecialidadDto>> Crear([FromBody] CrearEspecialidadDto dto)
    {
        try
        {
            var especialidad = await _especialidadService.CrearAsync(dto);
            return CreatedAtAction(
                nameof(ObtenerPorId),
                new { id = especialidad.Id },
                especialidad
            );
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarEspecialidadDto dto)
    {
        try
        {
            var resultado = await _especialidadService.ActualizarAsync(id, dto);

            if (!resultado)
            {
                return NotFound(new { mensaje = "Especialidad no encontrada." });
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var resultado = await _especialidadService.DesactivarAsync(id);

        if (!resultado)
        {
            return NotFound(new { mensaje = "Especialidad no encontrada." });
        }

        return NoContent();
    }
}
