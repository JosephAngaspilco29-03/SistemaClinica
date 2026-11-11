namespace SistemaClinica.Domain.Entities;

public class Usuario
{
    public int Id { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public int? PacienteId { get; set; }
    public int? MedicoId { get; set; }

    public Paciente? Paciente { get; set; }
    public Medico? Medico { get; set; }
}
