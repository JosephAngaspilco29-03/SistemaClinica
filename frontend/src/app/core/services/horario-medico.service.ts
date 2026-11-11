import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorarioMedico, CrearHorarioMedicoDto, ActualizarHorarioMedicoDto, CrearMiHorarioDto, ActualizarMiHorarioDto } from '../models/horario-medico.model';

@Injectable({ providedIn: 'root' })
export class HorarioMedicoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/HorariosMedicos';

  getHorarios(): Observable<HorarioMedico[]> {
    return this.http.get<HorarioMedico[]>(this.apiUrl);
  }

  // ---- Endpoints para Administrador ----

  crearHorario(dto: CrearHorarioMedicoDto): Observable<HorarioMedico> {
    return this.http.post<HorarioMedico>(this.apiUrl, dto);
  }

  actualizarHorario(id: number, dto: ActualizarHorarioMedicoDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto);
  }

  desactivarHorario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ---- Endpoints para Medico ----

  getMisHorarios(): Observable<HorarioMedico[]> {
    return this.http.get<HorarioMedico[]>(`${this.apiUrl}/mis-horarios`);
  }

  crearMiHorario(dto: CrearMiHorarioDto): Observable<HorarioMedico> {
    return this.http.post<HorarioMedico>(`${this.apiUrl}/mis-horarios`, dto);
  }

  actualizarMiHorario(id: number, dto: ActualizarMiHorarioDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/mis-horarios/${id}`, dto);
  }

  desactivarMiHorario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/mis-horarios/${id}`);
  }
}
