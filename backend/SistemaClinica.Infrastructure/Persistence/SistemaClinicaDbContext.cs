using Microsoft.EntityFrameworkCore;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Infrastructure.Persistence;

public class SistemaClinicaDbContext : DbContext
{
    public SistemaClinicaDbContext(DbContextOptions<SistemaClinicaDbContext> options)
        : base(options)
    {
    }

    public DbSet<Paciente> Pacientes { get; set; } = null!;
    public DbSet<Medico> Medicos { get; set; } = null!;
    public DbSet<Especialidad> Especialidades { get; set; } = null!;
    public DbSet<MedicoEspecialidad> MedicoEspecialidades { get; set; } = null!;
    public DbSet<HorarioMedico> HorariosMedicos { get; set; } = null!;
    public DbSet<Cita> Citas { get; set; } = null!;
    public DbSet<Triaje> Triajes { get; set; } = null!;
    public DbSet<AtencionMedica> AtencionesMedicas { get; set; } = null!;
    public DbSet<Diagnostico> Diagnosticos { get; set; } = null!;
    public DbSet<Usuario> Usuarios { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // MedicoEspecialidad
        modelBuilder.Entity<MedicoEspecialidad>()
            .HasKey(me => new { me.MedicoId, me.EspecialidadId });

        modelBuilder.Entity<MedicoEspecialidad>()
            .HasOne(me => me.Medico)
            .WithMany(m => m.MedicoEspecialidades)
            .HasForeignKey(me => me.MedicoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MedicoEspecialidad>()
            .HasOne(me => me.Especialidad)
            .WithMany(e => e.MedicoEspecialidades)
            .HasForeignKey(me => me.EspecialidadId)
            .OnDelete(DeleteBehavior.Restrict);

        // HorarioMedico
        modelBuilder.Entity<HorarioMedico>()
            .HasOne(hm => hm.Medico)
            .WithMany(m => m.Horarios)
            .HasForeignKey(hm => hm.MedicoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Cita - Paciente
        modelBuilder.Entity<Cita>()
            .HasOne(c => c.Paciente)
            .WithMany(p => p.Citas)
            .HasForeignKey(c => c.PacienteId)
            .OnDelete(DeleteBehavior.Restrict);

        // Cita - Medico
        modelBuilder.Entity<Cita>()
            .HasOne(c => c.Medico)
            .WithMany(m => m.Citas)
            .HasForeignKey(c => c.MedicoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Cita - Especialidad
        modelBuilder.Entity<Cita>()
            .HasOne(c => c.Especialidad)
            .WithMany(e => e.Citas)
            .HasForeignKey(c => c.EspecialidadId)
            .OnDelete(DeleteBehavior.Restrict);

        // Cita - HorarioMedico
        modelBuilder.Entity<Cita>()
            .HasOne(c => c.HorarioMedico)
            .WithMany(hm => hm.Citas)
            .HasForeignKey(c => c.HorarioMedicoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Cita - Triaje
        modelBuilder.Entity<Cita>()
            .HasOne(c => c.Triaje)
            .WithOne(t => t.Cita)
            .HasForeignKey<Triaje>(t => t.CitaId)
            .OnDelete(DeleteBehavior.Cascade);

        // Cita - AtencionMedica
        modelBuilder.Entity<Cita>()
            .HasOne(c => c.AtencionMedica)
            .WithOne(am => am.Cita)
            .HasForeignKey<AtencionMedica>(am => am.CitaId)
            .OnDelete(DeleteBehavior.Cascade);

        // AtencionMedica - Medico
        modelBuilder.Entity<AtencionMedica>()
            .HasOne(am => am.Medico)
            .WithMany(m => m.AtencionesMedicas)
            .HasForeignKey(am => am.MedicoId)
            .OnDelete(DeleteBehavior.Restrict);

        // AtencionMedica - Paciente
        modelBuilder.Entity<AtencionMedica>()
            .HasOne(am => am.Paciente)
            .WithMany(p => p.AtencionesMedicas)
            .HasForeignKey(am => am.PacienteId)
            .OnDelete(DeleteBehavior.Restrict);

        // AtencionMedica - Diagnostico
        modelBuilder.Entity<Diagnostico>()
            .HasOne(d => d.AtencionMedica)
            .WithMany(am => am.Diagnosticos)
            .HasForeignKey(d => d.AtencionMedicaId)
            .OnDelete(DeleteBehavior.Cascade);

        // Triaje Precsion
        modelBuilder.Entity<Triaje>(entity =>
        {
            entity.Property(e => e.PresionSistolica).HasPrecision(6, 2);
            entity.Property(e => e.PresionDiastolica).HasPrecision(6, 2);
            entity.Property(e => e.Temperatura).HasPrecision(4, 1);
            entity.Property(e => e.Peso).HasPrecision(6, 2);
            entity.Property(e => e.Talla).HasPrecision(4, 2);
            entity.Property(e => e.Imc).HasPrecision(5, 2);
        });

        // Indices
        modelBuilder.Entity<Paciente>()
            .HasIndex(p => p.DocumentoIdentidad)
            .IsUnique();

        modelBuilder.Entity<Medico>()
            .HasIndex(m => m.NumeroColegiatura)
            .IsUnique();

        modelBuilder.Entity<Especialidad>()
            .HasIndex(e => e.Nombre)
            .IsUnique();

        // Propiedades Paciente
        modelBuilder.Entity<Paciente>(entity =>
        {
            entity.Property(e => e.Nombres).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Apellidos).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DocumentoIdentidad).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Sexo).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Telefono).HasMaxLength(20);
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.Direccion).HasMaxLength(250);
        });

        // Propiedades Medico
        modelBuilder.Entity<Medico>(entity =>
        {
            entity.Property(e => e.Nombres).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Apellidos).IsRequired().HasMaxLength(100);
            entity.Property(e => e.NumeroColegiatura).IsRequired().HasMaxLength(30);
            entity.Property(e => e.Telefono).HasMaxLength(20);
            entity.Property(e => e.Email).HasMaxLength(150);
        });

        // Propiedades Especialidad
        modelBuilder.Entity<Especialidad>(entity =>
        {
            entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Descripcion).HasMaxLength(300);
        });

        // Propiedades Cita
        modelBuilder.Entity<Cita>(entity =>
        {
            entity.Property(e => e.MotivoConsulta).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Estado).IsRequired().HasMaxLength(30);
        });

        // Propiedades Triaje
        modelBuilder.Entity<Triaje>(entity =>
        {
            entity.Property(e => e.Observaciones).HasMaxLength(500);
        });

        // Propiedades AtencionMedica
        modelBuilder.Entity<AtencionMedica>(entity =>
        {
            entity.Property(e => e.MotivoConsulta).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Anamnesis).HasMaxLength(2000);
            entity.Property(e => e.ExamenFisico).HasMaxLength(2000);
            entity.Property(e => e.Indicaciones).HasMaxLength(2000);
            entity.Property(e => e.Observaciones).HasMaxLength(1000);
        });

        // Propiedades Diagnostico
        modelBuilder.Entity<Diagnostico>(entity =>
        {
            entity.Property(e => e.CodigoCie10).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Descripcion).IsRequired().HasMaxLength(500);
        });

        // Propiedades Usuario
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.Property(e => e.NombreUsuario).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Rol).IsRequired().HasMaxLength(30);
        });

        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.NombreUsuario)
            .IsUnique();

        modelBuilder.Entity<Usuario>()
            .HasOne(u => u.Paciente)
            .WithMany()
            .HasForeignKey(u => u.PacienteId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Usuario>()
            .HasOne(u => u.Medico)
            .WithMany()
            .HasForeignKey(u => u.MedicoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
