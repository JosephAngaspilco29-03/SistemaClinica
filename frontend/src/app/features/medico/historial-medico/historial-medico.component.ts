import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistorialClinicoService } from '../../../core/services/historial-clinico.service';
import {
  HistorialClinico,
  HistorialAtencion,
  PacienteResumen
} from '../../../core/models/historial-clinico.model';

type Vista = 'lista' | 'historial';

@Component({
  selector: 'app-historial-medico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-medico.component.html',
  styleUrl: './historial-medico.component.scss'
})
export class HistorialMedicoComponent implements OnInit {
  private historialService = inject(HistorialClinicoService);

  // ── Estado general ────────────────────────────────────────────────────────
  vista = signal<Vista>('lista');
  loadingPacientes = signal(true);
  errorPacientes = signal(false);
  loadingHistorial = signal(false);
  errorHistorial = signal<string | null>(null);

  // ── Lista de pacientes ────────────────────────────────────────────────────
  pacientes = signal<PacienteResumen[]>([]);
  busqueda = signal('');

  pacientesFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.pacientes();
    return this.pacientes().filter(
      p =>
        p.nombreCompleto.toLowerCase().includes(q) ||
        p.documentoIdentidad.toLowerCase().includes(q)
    );
  });

  // ── Historial del paciente seleccionado ───────────────────────────────────
  pacienteSeleccionado = signal<PacienteResumen | null>(null);
  historial = signal<HistorialClinico | null>(null);
  atenciones = signal<HistorialAtencion[]>([]);
  expandedCards = signal<Set<number>>(new Set());

  ngOnInit() {
    this.cargarPacientes();
  }

  cargarPacientes() {
    this.loadingPacientes.set(true);
    this.errorPacientes.set(false);

    this.historialService.obtenerMisPacientes().subscribe({
      next: (data) => {
        this.pacientes.set(data);
        this.loadingPacientes.set(false);
      },
      error: () => {
        this.errorPacientes.set(true);
        this.loadingPacientes.set(false);
      }
    });
  }

  seleccionarPaciente(paciente: PacienteResumen) {
    this.pacienteSeleccionado.set(paciente);
    this.historial.set(null);
    this.atenciones.set([]);
    this.expandedCards.set(new Set());
    this.errorHistorial.set(null);
    this.loadingHistorial.set(true);
    this.vista.set('historial');

    this.historialService.obtenerHistorialParaMedico(paciente.id).subscribe({
      next: (data) => {
        this.historial.set(data);
        const sorted = [...data.atenciones].sort(
          (a, b) =>
            new Date(b.fechaAtencion).getTime() - new Date(a.fechaAtencion).getTime()
        );
        this.atenciones.set(sorted);
        this.loadingHistorial.set(false);
      },
      error: (err) => {
        const status = err?.status;
        if (status === 403) {
          this.errorHistorial.set('No tiene acceso al historial de este paciente.');
        } else {
          this.errorHistorial.set('Error al cargar el historial clínico.');
        }
        this.loadingHistorial.set(false);
      }
    });
  }

  volverALista() {
    this.vista.set('lista');
    this.pacienteSeleccionado.set(null);
    this.historial.set(null);
    this.atenciones.set([]);
    this.errorHistorial.set(null);
    this.busqueda.set('');
  }

  toggleCard(id: number) {
    const s = new Set(this.expandedCards());
    s.has(id) ? s.delete(id) : s.add(id);
    this.expandedCards.set(s);
  }

  isExpanded(id: number): boolean {
    return this.expandedCards().has(id);
  }

  getDiagnosticoPrincipal(atencion: HistorialAtencion) {
    return atencion.diagnosticos.find(d => d.principal) ?? null;
  }

  getOtrosDiagnosticos(atencion: HistorialAtencion) {
    return atencion.diagnosticos.filter(d => !d.principal);
  }

  calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  getImcLabel(imc: number): string {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
  }

  getImcClass(imc: number): string {
    if (imc < 18.5) return 'imc-bajo';
    if (imc < 25) return 'imc-normal';
    if (imc < 30) return 'imc-sobrepeso';
    return 'imc-obesidad';
  }

  onBusqueda(event: Event) {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }
}
