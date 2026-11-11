using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SistemaClinica.Application.DTOs.Medicos;

public class CrearMedicoDto
{
    [Required(ErrorMessage = "Los nombres son obligatorios.")]
    [StringLength(100, ErrorMessage = "Los nombres no pueden superar los 100 caracteres.")]
    public string Nombres { get; set; } = string.Empty;

    [Required(ErrorMessage = "Los apellidos son obligatorios.")]
    [StringLength(100, ErrorMessage = "Los apellidos no pueden superar los 100 caracteres.")]
    public string Apellidos { get; set; } = string.Empty;

    [Required(ErrorMessage = "El número de colegiatura es obligatorio.")]
    [StringLength(30, ErrorMessage = "El número de colegiatura no puede superar los 30 caracteres.")]
    public string NumeroColegiatura { get; set; } = string.Empty;

    [StringLength(20, ErrorMessage = "El teléfono no puede superar los 20 caracteres.")]
    public string Telefono { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "El correo electrónico no es válido.")]
    [StringLength(150, ErrorMessage = "El correo no puede superar los 150 caracteres.")]
    public string Email { get; set; } = string.Empty;

    [MinLength(1, ErrorMessage = "Debe seleccionar al menos una especialidad.")]
    public List<int> EspecialidadIds { get; set; } = new List<int>();
}
