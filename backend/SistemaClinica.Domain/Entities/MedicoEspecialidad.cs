namespace SistemaClinica.Domain.Entities;

public class MedicoEspecialidad
{
    public int MedicoId { get; set; }
    public int EspecialidadId { get; set; }

    public Medico Medico { get; set; } = null!;
    public Especialidad Especialidad { get; set; } = null!;
}
