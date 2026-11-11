using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SistemaClinica.Application.DTOs.Triajes;
using SistemaClinica.Application.Interfaces.Repositories;
using SistemaClinica.Application.Interfaces.Services;
using SistemaClinica.Domain.Entities;

namespace SistemaClinica.Application.Services;

public class TriajeService : ITriajeService
{
    private readonly ITriajeRepository _triajeRepository;
    private readonly ICitaRepository _citaRepository;

    public TriajeService(ITriajeRepository triajeRepository, ICitaRepository citaRepository)
    {
        _triajeRepository = triajeRepository;
        _citaRepository = citaRepository;
    }

    public async Task<IReadOnlyList<TriajeDto>> ObtenerTodosAsync()
    {
        var triajes = await _triajeRepository.ObtenerTodosAsync();
        return triajes.Select(MapearADto).ToList();
    }

    public async Task<TriajeDto?> ObtenerPorIdAsync(int id)
    {
        var triaje = await _triajeRepository.ObtenerPorIdAsync(id);

        if (triaje == null)
            return null;

        return MapearADto(triaje);
    }

    public async Task<TriajeDto?> ObtenerPorCitaIdAsync(int citaId)
    {
        var triaje = await _triajeRepository.ObtenerPorCitaIdAsync(citaId);

        if (triaje == null)
            return null;

        return MapearADto(triaje);
    }

    public async Task<TriajeDto> CrearAsync(CrearTriajeDto dto)
    {
        var cita = await _citaRepository.ObtenerPorIdAsync(dto.CitaId);
        if (cita == null)
        {
            throw new InvalidOperationException($"La cita con Id {dto.CitaId} no existe.");
        }

        if (cita.Estado == "Cancelada")
        {
            throw new InvalidOperationException("No se puede registrar triaje para una cita cancelada.");
        }

        if (cita.Estado == "Atendida")
        {
            throw new InvalidOperationException("No se puede registrar triaje para una cita ya atendida.");
        }

        if (cita.Estado != "Reservada" && cita.Estado != "Reprogramada")
        {
            throw new InvalidOperationException("El estado de la cita no permite registrar un nuevo triaje.");
        }

        if (cita.FechaHora.Date != DateTime.Now.Date)
        {
            throw new InvalidOperationException("El triaje solo puede registrarse el día de la cita.");
        }

        var existeTriaje = await _triajeRepository.ObtenerPorCitaIdAsync(dto.CitaId);
        if (existeTriaje != null)
        {
            throw new InvalidOperationException("La cita ya tiene un triaje registrado.");
        }

        ValidarSignosVitales(
            dto.PresionSistolica,
            dto.PresionDiastolica,
            dto.Temperatura,
            dto.FrecuenciaCardiaca,
            dto.Peso,
            dto.Talla);

        var imc = CalcularImc(dto.Peso, dto.Talla);

        var triaje = new Triaje
        {
            CitaId = dto.CitaId,
            PresionSistolica = dto.PresionSistolica,
            PresionDiastolica = dto.PresionDiastolica,
            Temperatura = dto.Temperatura,
            FrecuenciaCardiaca = dto.FrecuenciaCardiaca,
            Peso = dto.Peso,
            Talla = dto.Talla,
            Imc = imc,
            FechaRegistro = DateTime.Now,
            Observaciones = dto.Observaciones
        };

        var triajeCreado = await _triajeRepository.CrearAsync(triaje);

        return MapearADto(triajeCreado);
    }

    public async Task<bool> ActualizarAsync(int id, ActualizarTriajeDto dto)
    {
        var triaje = await _triajeRepository.ObtenerPorIdAsync(id);
        if (triaje == null)
            return false;

        ValidarSignosVitales(
            dto.PresionSistolica,
            dto.PresionDiastolica,
            dto.Temperatura,
            dto.FrecuenciaCardiaca,
            dto.Peso,
            dto.Talla);

        triaje.PresionSistolica = dto.PresionSistolica;
        triaje.PresionDiastolica = dto.PresionDiastolica;
        triaje.Temperatura = dto.Temperatura;
        triaje.FrecuenciaCardiaca = dto.FrecuenciaCardiaca;
        triaje.Peso = dto.Peso;
        triaje.Talla = dto.Talla;
        triaje.Observaciones = dto.Observaciones;
        
        triaje.Imc = CalcularImc(dto.Peso, dto.Talla);

        await _triajeRepository.ActualizarAsync(triaje);

        return true;
    }

    private void ValidarSignosVitales(
        decimal presionSistolica,
        decimal presionDiastolica,
        decimal temperatura,
        int frecuenciaCardiaca,
        decimal peso,
        decimal talla)
    {
        if (presionSistolica <= 0)
            throw new InvalidOperationException("La presión sistólica debe ser mayor que cero.");

        if (presionDiastolica <= 0)
            throw new InvalidOperationException("La presión diastólica debe ser mayor que cero.");

        if (temperatura <= 0)
            throw new InvalidOperationException("La temperatura debe ser mayor que cero.");

        if (frecuenciaCardiaca <= 0)
            throw new InvalidOperationException("La frecuencia cardíaca debe ser mayor que cero.");

        if (peso <= 0)
            throw new InvalidOperationException("El peso debe ser mayor que cero.");

        if (talla <= 0)
            throw new InvalidOperationException("La talla debe ser mayor que cero.");
    }

    private static decimal CalcularImc(decimal peso, decimal talla)
    {
        var resultado = peso / (talla * talla);
        return Math.Round(resultado, 2, MidpointRounding.AwayFromZero);
    }

    private static TriajeDto MapearADto(Triaje triaje)
    {
        return new TriajeDto
        {
            Id = triaje.Id,
            CitaId = triaje.CitaId,
            PresionSistolica = triaje.PresionSistolica,
            PresionDiastolica = triaje.PresionDiastolica,
            Temperatura = triaje.Temperatura,
            FrecuenciaCardiaca = triaje.FrecuenciaCardiaca,
            Peso = triaje.Peso,
            Talla = triaje.Talla,
            Imc = triaje.Imc,
            FechaRegistro = triaje.FechaRegistro,
            Observaciones = triaje.Observaciones
        };
    }
}
