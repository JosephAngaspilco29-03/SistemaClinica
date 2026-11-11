namespace SistemaClinica.Application.DTOs.Citas;

public class CrearCitaDto
{
    public int PacienteId { get; set; }
    public int MedicoId { get; set; }
    public int EspecialidadId { get; set; }
    public int HorarioMedicoId { get; set; }
    public string MotivoConsulta { get; set; } = string.Empty;
}
