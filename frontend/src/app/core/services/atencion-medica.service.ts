import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AtencionMedica, CrearAtencionMedicaDto } from '../models/atencion-medica.model';

@Injectable({
  providedIn: 'root'
})
export class AtencionMedicaService {
  private http = inject(HttpClient);
  private apiUrl = '/api/AtencionesMedicas';

  getAtenciones(): Observable<AtencionMedica[]> {
    return this.http.get<AtencionMedica[]>(this.apiUrl);
  }

  getAtencionPorCitaId(citaId: number): Observable<AtencionMedica> {
    return this.http.get<AtencionMedica>(`${this.apiUrl}/cita/${citaId}`);
  }

  crearAtencion(dto: CrearAtencionMedicaDto): Observable<AtencionMedica> {
    return this.http.post<AtencionMedica>(this.apiUrl, dto);
  }
}
