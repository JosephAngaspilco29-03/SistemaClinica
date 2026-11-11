import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReporteAtenciones, ReporteAusentismo } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private http = inject(HttpClient);
  private apiUrl = '/api/Reportes';

  /** Obtiene el reporte de atenciones médicas (requiere rol Administrador). */
  getReporteAtenciones(): Observable<ReporteAtenciones> {
    return this.http.get<ReporteAtenciones>(`${this.apiUrl}/atenciones`);
  }

  /** Obtiene el reporte de ausentismo y resumen de citas (requiere rol Administrador). */
  getReporteAusentismo(): Observable<ReporteAusentismo> {
    return this.http.get<ReporteAusentismo>(`${this.apiUrl}/ausentismo`);
  }
}

