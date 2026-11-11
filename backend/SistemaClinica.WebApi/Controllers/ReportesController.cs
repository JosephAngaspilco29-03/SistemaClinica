using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaClinica.Application.Interfaces.Services;

namespace SistemaClinica.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class ReportesController : ControllerBase
{
    private readonly IReporteService _reporteService;

    public ReportesController(IReporteService reporteService)
    {
        _reporteService = reporteService;
    }

    [HttpGet("atenciones")]
    public async Task<IActionResult> ObtenerReporteAtenciones()
    {
        var reporte = await _reporteService.ObtenerReporteAtencionesAsync();
        return Ok(reporte);
    }

    [HttpGet("ausentismo")]
    public async Task<IActionResult> ObtenerReporteAusentismo()
    {
        var reporte = await _reporteService.ObtenerReporteAusentismoAsync();
        return Ok(reporte);
    }
}
