using System;
using System.Collections.Generic;

namespace SistemaClinica.Application.DTOs.Reportes;

public class ReporteAtencionesDto
{
    public int TotalAtenciones { get; set; }
    public IReadOnlyList<ReporteAtencionItemDto> Atenciones { get; set; } = Array.Empty<ReporteAtencionItemDto>();
}
