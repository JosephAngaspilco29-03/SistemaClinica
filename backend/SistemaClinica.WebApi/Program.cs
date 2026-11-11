using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Application.Interfaces.Services;
using SistemaClinica.Application.Services;
using SistemaClinica.Domain.Entities;
using SistemaClinica.Infrastructure.Persistence;
using SistemaClinica.Infrastructure.Repositories;
using SistemaClinica.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<SistemaClinicaDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// Cookie Authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "SistemaClinica.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;

        // Responder 401 en lugar de redirigir a login HTML
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = 401;
            return Task.CompletedTask;
        };

        // Responder 403 en lugar de redirigir a access denied HTML
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = 403;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddScoped<IPacienteRepository, PacienteRepository>();
builder.Services.AddScoped<IPacienteService, PacienteService>();
builder.Services.AddScoped<IEspecialidadRepository, EspecialidadRepository>();
builder.Services.AddScoped<IEspecialidadService, EspecialidadService>();
builder.Services.AddScoped<IMedicoRepository, MedicoRepository>();
builder.Services.AddScoped<IMedicoService, MedicoService>();
builder.Services.AddScoped<IHorarioMedicoRepository, HorarioMedicoRepository>();
builder.Services.AddScoped<IHorarioMedicoService, HorarioMedicoService>();
builder.Services.AddScoped<ICitaRepository, CitaRepository>();
builder.Services.AddScoped<ICitaService, CitaService>();
builder.Services.AddScoped<ITriajeRepository, TriajeRepository>();
builder.Services.AddScoped<ITriajeService, TriajeService>();
builder.Services.AddScoped<IAtencionMedicaRepository, AtencionMedicaRepository>();
builder.Services.AddScoped<IAtencionMedicaService, AtencionMedicaService>();
builder.Services.AddScoped<IHistorialClinicoService, HistorialClinicoService>();
builder.Services.AddScoped<IReporteService, ReporteService>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();

var app = builder.Build();

// Seeder de administrador inicial (solo en Development)
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<SistemaClinicaDbContext>();

    if (!context.Usuarios.Any())
    {
        var passwordHasher = new PasswordHasher<Usuario>();
        var admin = new Usuario
        {
            NombreUsuario = "admin",
            Rol = "Administrador",
            Activo = true,
            PacienteId = null,
            MedicoId = null
        };
        admin.PasswordHash = passwordHasher.HashPassword(admin, "Admin123!");

        context.Usuarios.Add(admin);
        context.SaveChanges();
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
