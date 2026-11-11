using System.ComponentModel.DataAnnotations;

namespace SistemaClinica.Application.DTOs.Auth;

public class RestablecerPasswordDto
{
    [Required(ErrorMessage = "La nueva contraseña es obligatoria.")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
    [StringLength(100, ErrorMessage = "La contraseña no puede superar los 100 caracteres.")]
    public string NuevaPassword { get; set; } = string.Empty;
}

