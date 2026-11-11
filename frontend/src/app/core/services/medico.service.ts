import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Medico, CrearMedicoDto, ActualizarMedicoDto } from '../models/medico.model';

@Injectable({ providedIn: 'root' })
export class MedicoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/Medicos';

  /** Obtiene todos los médicos (requiere rol Administrador). */
  getMedicos(): Observable<Medico[]> {
    return this.http.get<Medico[]>(this.apiUrl);
  }

  /** Registra un nuevo médico (requiere rol Administrador). */
  crearMedico(dto: CrearMedicoDto): Observable<Medico> {
    return this.http.post<Medico>(this.apiUrl, dto);
  }

  /** Actualiza un médico existente (requiere rol Administrador). */
  actualizarMedico(id: number, dto: ActualizarMedicoDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto);
  }

  /** Desactiva lógicamente un médico (requiere rol Administrador). */
  desactivarMedico(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Obtiene un médico por ID (requiere rol Administrador). */
  getMedicoById(id: number): Observable<Medico> {
    return this.http.get<Medico>(`${this.apiUrl}/${id}`);
  }
}
