namespace SistemaClinica.Application.DTOs.Auth;

public class UsuarioAutenticadoDto
{
    public int Id { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public int? PacienteId { get; set; }
    public int? MedicoId { get; set; }
}
