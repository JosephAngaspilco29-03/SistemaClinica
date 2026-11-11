import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita, CrearCitaDto, ReprogramarCitaDto } from '../models/cita.model';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private http = inject(HttpClient);
  private apiUrl = '/api/Citas';

  getMisCitas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.apiUrl}/mis-citas`);
  }

  getTodas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(this.apiUrl);
  }

  crearCita(dto: CrearCitaDto): Observable<Cita> {
    return this.http.post<Cita>(this.apiUrl, dto);
  }

  cancelarCita(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  reprogramarCita(id: number, dto: ReprogramarCitaDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/reprogramar`, dto);
  }
}
