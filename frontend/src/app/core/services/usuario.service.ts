import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrearUsuarioDto, UsuarioListado } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = '/api/Auth/usuarios';

  /** Obtiene todos los usuarios (requiere rol Administrador). */
  getUsuarios(): Observable<UsuarioListado[]> {
    return this.http.get<UsuarioListado[]>(this.apiUrl);
  }

  /** Crea una cuenta de Medico o Enfermero (requiere rol Administrador). La respuesta no incluye contraseña. */
  crearUsuario(dto: CrearUsuarioDto): Observable<UsuarioListado> {
    return this.http.post<UsuarioListado>(this.apiUrl, dto);
  }

  /** Restablece la contraseña de un usuario (solo Administrador). No devuelve contraseña ni hash. */
  restablecerPassword(id: number, nuevaPassword: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/password`, { nuevaPassword });
  }
}

