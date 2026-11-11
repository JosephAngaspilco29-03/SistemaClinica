import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Especialidad, CrearEspecialidadDto, ActualizarEspecialidadDto } from '../models/especialidad.model';

@Injectable({ providedIn: 'root' })
export class EspecialidadService {
  private http = inject(HttpClient);
  private apiUrl = '/api/Especialidades';

  getEspecialidades(): Observable<Especialidad[]> {
    return this.http.get<Especialidad[]>(this.apiUrl);
  }

  /** Actualiza una especialidad existente (requiere rol Administrador). */
  actualizarEspecialidad(id: number, dto: ActualizarEspecialidadDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto);
  }

  /** Registra una nueva especialidad (requiere rol Administrador). */
  crearEspecialidad(dto: CrearEspecialidadDto): Observable<Especialidad> {
    return this.http.post<Especialidad>(this.apiUrl, dto);
  }

  /** Desactiva lógicamente una especialidad (requiere rol Administrador). */
  desactivarEspecialidad(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
