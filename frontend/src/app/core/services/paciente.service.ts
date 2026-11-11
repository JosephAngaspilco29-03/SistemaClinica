import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente, CrearPacienteRequest, ActualizarPacienteRequest } from '../models/paciente.model';

@Injectable({ providedIn: 'root' })
export class PacienteService {
  private http = inject(HttpClient);
  private apiUrl = '/api/Pacientes';

  /** Obtiene todos los pacientes (requiere rol Administrador). */
  getPacientes(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.apiUrl);
  }

  /** Obtiene un paciente por ID (requiere rol Administrador). */
  getPacienteById(id: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.apiUrl}/${id}`);
  }

  /** Crea un nuevo paciente (requiere rol Administrador). Retorna 409 si el documento ya existe. */
  crearPaciente(payload: CrearPacienteRequest): Observable<Paciente> {
    return this.http.post<Paciente>(this.apiUrl, payload);
  }

  /** Actualiza un paciente existente (requiere rol Administrador). */
  actualizarPaciente(id: number, payload: ActualizarPacienteRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }
}
