import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Triaje, CrearTriajeDto, ActualizarTriajeDto } from '../models/triaje.model';

@Injectable({
  providedIn: 'root'
})
export class TriajeService {
  private http = inject(HttpClient);
  private apiUrl = '/api/Triajes';

  getTriajes(): Observable<Triaje[]> {
    return this.http.get<Triaje[]>(this.apiUrl);
  }

  getTriajePorCitaId(citaId: number): Observable<Triaje> {
    return this.http.get<Triaje>(`${this.apiUrl}/cita/${citaId}`);
  }

  crearTriaje(dto: CrearTriajeDto): Observable<Triaje> {
    return this.http.post<Triaje>(this.apiUrl, dto);
  }

  actualizarTriaje(id: number, dto: ActualizarTriajeDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto);
  }
}
