IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Especialidades] (
    [Id] int NOT NULL IDENTITY,
    [Nombre] nvarchar(100) NOT NULL,
    [Descripcion] nvarchar(300) NOT NULL,
    [Activo] bit NOT NULL,
    CONSTRAINT [PK_Especialidades] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Medicos] (
    [Id] int NOT NULL IDENTITY,
    [Nombres] nvarchar(100) NOT NULL,
    [Apellidos] nvarchar(100) NOT NULL,
    [NumeroColegiatura] nvarchar(30) NOT NULL,
    [Telefono] nvarchar(20) NOT NULL,
    [Email] nvarchar(150) NOT NULL,
    [Activo] bit NOT NULL,
    CONSTRAINT [PK_Medicos] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Pacientes] (
    [Id] int NOT NULL IDENTITY,
    [Nombres] nvarchar(100) NOT NULL,
    [Apellidos] nvarchar(100) NOT NULL,
    [DocumentoIdentidad] nvarchar(20) NOT NULL,
    [FechaNacimiento] datetime2 NOT NULL,
    [Sexo] nvarchar(20) NOT NULL,
    [Telefono] nvarchar(20) NOT NULL,
    [Email] nvarchar(150) NOT NULL,
    [Direccion] nvarchar(250) NOT NULL,
    [Activo] bit NOT NULL,
    CONSTRAINT [PK_Pacientes] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [HorariosMedicos] (
    [Id] int NOT NULL IDENTITY,
    [MedicoId] int NOT NULL,
    [Fecha] datetime2 NOT NULL,
    [HoraInicio] time NOT NULL,
    [HoraFin] time NOT NULL,
    [CuposDisponibles] int NOT NULL,
    [Activo] bit NOT NULL,
    CONSTRAINT [PK_HorariosMedicos] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_HorariosMedicos_Medicos_MedicoId] FOREIGN KEY ([MedicoId]) REFERENCES [Medicos] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [MedicoEspecialidades] (
    [MedicoId] int NOT NULL,
    [EspecialidadId] int NOT NULL,
    CONSTRAINT [PK_MedicoEspecialidades] PRIMARY KEY ([MedicoId], [EspecialidadId]),
    CONSTRAINT [FK_MedicoEspecialidades_Especialidades_EspecialidadId] FOREIGN KEY ([EspecialidadId]) REFERENCES [Especialidades] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_MedicoEspecialidades_Medicos_MedicoId] FOREIGN KEY ([MedicoId]) REFERENCES [Medicos] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [Citas] (
    [Id] int NOT NULL IDENTITY,
    [PacienteId] int NOT NULL,
    [MedicoId] int NOT NULL,
    [EspecialidadId] int NOT NULL,
    [HorarioMedicoId] int NOT NULL,
    [FechaHora] datetime2 NOT NULL,
    [MotivoConsulta] nvarchar(500) NOT NULL,
    [Estado] nvarchar(30) NOT NULL,
    [FechaRegistro] datetime2 NOT NULL,
    CONSTRAINT [PK_Citas] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Citas_Especialidades_EspecialidadId] FOREIGN KEY ([EspecialidadId]) REFERENCES [Especialidades] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Citas_HorariosMedicos_HorarioMedicoId] FOREIGN KEY ([HorarioMedicoId]) REFERENCES [HorariosMedicos] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Citas_Medicos_MedicoId] FOREIGN KEY ([MedicoId]) REFERENCES [Medicos] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Citas_Pacientes_PacienteId] FOREIGN KEY ([PacienteId]) REFERENCES [Pacientes] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [AtencionesMedicas] (
    [Id] int NOT NULL IDENTITY,
    [CitaId] int NOT NULL,
    [MedicoId] int NOT NULL,
    [PacienteId] int NOT NULL,
    [FechaAtencion] datetime2 NOT NULL,
    [MotivoConsulta] nvarchar(500) NOT NULL,
    [Anamnesis] nvarchar(2000) NOT NULL,
    [ExamenFisico] nvarchar(2000) NOT NULL,
    [Indicaciones] nvarchar(2000) NOT NULL,
    [Observaciones] nvarchar(1000) NOT NULL,
    CONSTRAINT [PK_AtencionesMedicas] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AtencionesMedicas_Citas_CitaId] FOREIGN KEY ([CitaId]) REFERENCES [Citas] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_AtencionesMedicas_Medicos_MedicoId] FOREIGN KEY ([MedicoId]) REFERENCES [Medicos] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_AtencionesMedicas_Pacientes_PacienteId] FOREIGN KEY ([PacienteId]) REFERENCES [Pacientes] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [Triajes] (
    [Id] int NOT NULL IDENTITY,
    [CitaId] int NOT NULL,
    [PresionSistolica] decimal(6,2) NOT NULL,
    [PresionDiastolica] decimal(6,2) NOT NULL,
    [Temperatura] decimal(4,1) NOT NULL,
    [FrecuenciaCardiaca] int NOT NULL,
    [Peso] decimal(6,2) NOT NULL,
    [Talla] decimal(4,2) NOT NULL,
    [Imc] decimal(5,2) NOT NULL,
    [FechaRegistro] datetime2 NOT NULL,
    [Observaciones] nvarchar(500) NOT NULL,
    CONSTRAINT [PK_Triajes] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Triajes_Citas_CitaId] FOREIGN KEY ([CitaId]) REFERENCES [Citas] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [Diagnosticos] (
    [Id] int NOT NULL IDENTITY,
    [AtencionMedicaId] int NOT NULL,
    [CodigoCie10] nvarchar(20) NOT NULL,
    [Descripcion] nvarchar(500) NOT NULL,
    [Principal] bit NOT NULL,
    CONSTRAINT [PK_Diagnosticos] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Diagnosticos_AtencionesMedicas_AtencionMedicaId] FOREIGN KEY ([AtencionMedicaId]) REFERENCES [AtencionesMedicas] ([Id]) ON DELETE CASCADE
);
GO

CREATE UNIQUE INDEX [IX_AtencionesMedicas_CitaId] ON [AtencionesMedicas] ([CitaId]);
GO

CREATE INDEX [IX_AtencionesMedicas_MedicoId] ON [AtencionesMedicas] ([MedicoId]);
GO

CREATE INDEX [IX_AtencionesMedicas_PacienteId] ON [AtencionesMedicas] ([PacienteId]);
GO

CREATE INDEX [IX_Citas_EspecialidadId] ON [Citas] ([EspecialidadId]);
GO

CREATE INDEX [IX_Citas_HorarioMedicoId] ON [Citas] ([HorarioMedicoId]);
GO

CREATE INDEX [IX_Citas_MedicoId] ON [Citas] ([MedicoId]);
GO

CREATE INDEX [IX_Citas_PacienteId] ON [Citas] ([PacienteId]);
GO

CREATE INDEX [IX_Diagnosticos_AtencionMedicaId] ON [Diagnosticos] ([AtencionMedicaId]);
GO

CREATE UNIQUE INDEX [IX_Especialidades_Nombre] ON [Especialidades] ([Nombre]);
GO

CREATE INDEX [IX_HorariosMedicos_MedicoId] ON [HorariosMedicos] ([MedicoId]);
GO

CREATE INDEX [IX_MedicoEspecialidades_EspecialidadId] ON [MedicoEspecialidades] ([EspecialidadId]);
GO

CREATE UNIQUE INDEX [IX_Medicos_NumeroColegiatura] ON [Medicos] ([NumeroColegiatura]);
GO

CREATE UNIQUE INDEX [IX_Pacientes_DocumentoIdentidad] ON [Pacientes] ([DocumentoIdentidad]);
GO

CREATE UNIQUE INDEX [IX_Triajes_CitaId] ON [Triajes] ([CitaId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260927065201_InitialCreate', N'8.0.14');
GO

COMMIT;
GO

