using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Reportes;

namespace SistemaClinica.Application.Interfaces.Services;

public interface IReporteService
{
    Task<ReporteAtencionesDto> ObtenerReporteAtencionesAsync();
    Task<ReporteAusentismoDto> ObtenerReporteAusentismoAsync();
}
