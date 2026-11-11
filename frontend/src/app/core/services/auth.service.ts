import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { User, LoginRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  // undefined means state is unknown, null means not authenticated
  currentUser = signal<User | null | undefined>(undefined);

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<User>('/api/Auth/login', credentials).pipe(
      tap(user => {
        this.currentUser.set(user);
      })
    );
  }

  register(data: any): Observable<User> {
    return this.http.post<User>('/api/Auth/registro', data);
  }

  logout(): Observable<any> {
    return this.http.post('/api/Auth/logout', {}).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  me(): Observable<User | null> {
    return this.http.get<User>('/api/Auth/me').pipe(
      tap(user => this.currentUser.set(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  clearSession() {
    this.currentUser.set(null);
  }
}
