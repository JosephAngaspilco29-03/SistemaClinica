import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistorialClinico, PacienteResumen } from '../models/historial-clinico.model';

@Injectable({
  providedIn: 'root'
})
export class HistorialClinicoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/HistorialClinico';

  /** Para Paciente: obtiene su propio historial */
  obtenerHistorialPaciente(pacienteId: number): Observable<HistorialClinico> {
    return this.http.get<HistorialClinico>(`${this.apiUrl}/paciente/${pacienteId}`);
  }

  /** Para Médico: obtiene historial de un paciente vinculado (403 si no tiene citas con él) */
  obtenerHistorialParaMedico(pacienteId: number): Observable<HistorialClinico> {
    return this.http.get<HistorialClinico>(`${this.apiUrl}/paciente/${pacienteId}`);
  }

  /** Para Médico: lista de pacientes con los que tiene citas registradas */
  obtenerMisPacientes(): Observable<PacienteResumen[]> {
    return this.http.get<PacienteResumen[]>(`${this.apiUrl}/mis-pacientes`);
  }
}
