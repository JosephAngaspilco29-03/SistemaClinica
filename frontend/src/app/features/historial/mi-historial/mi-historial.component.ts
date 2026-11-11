import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistorialClinicoService } from '../../../core/services/historial-clinico.service';
import { AuthService } from '../../../core/services/auth.service';
import { HistorialClinico, HistorialAtencion } from '../../../core/models/historial-clinico.model';

@Component({
  selector: 'app-mi-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-historial.component.html',
  styleUrl: './mi-historial.component.scss'
})
export class MiHistorialComponent implements OnInit {
  private historialService = inject(HistorialClinicoService);
  private authService = inject(AuthService);

  historial = signal<HistorialClinico | null>(null);
  atenciones = signal<HistorialAtencion[]>([]);
  expandedCards = signal<Set<number>>(new Set());
  
  loading = signal<boolean>(true);
  error = signal<boolean>(false);
  
  ngOnInit() {
    this.cargarHistorial();
  }

  cargarHistorial() {
    const pacienteId = this.authService.currentUser()?.pacienteId;
    if (!pacienteId) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(false);

    this.historialService.obtenerHistorialPaciente(pacienteId).subscribe({
      next: (data) => {
        this.historial.set(data);
        
        // Sort descending by date
        const sortedAtenciones = [...data.atenciones].sort((a, b) => {
          return new Date(b.fechaAtencion).getTime() - new Date(a.fechaAtencion).getTime();
        });
        
        this.atenciones.set(sortedAtenciones);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  toggleCard(atencionId: number) {
    const expanded = new Set(this.expandedCards());
    if (expanded.has(atencionId)) {
      expanded.delete(atencionId);
    } else {
      expanded.add(atencionId);
    }
    this.expandedCards.set(expanded);
  }

  isExpanded(atencionId: number): boolean {
    return this.expandedCards().has(atencionId);
  }

  getDiagnosticoPrincipal(atencion: HistorialAtencion) {
    return atencion.diagnosticos.find(d => d.principal);
  }

  getOtrosDiagnosticos(atencion: HistorialAtencion) {
    return atencion.diagnosticos.filter(d => !d.principal);
  }
}
