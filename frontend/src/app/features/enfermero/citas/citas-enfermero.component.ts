import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CitasService } from '../../../core/services/citas.service';
import { TriajeService } from '../../../core/services/triaje.service';
import { Cita } from '../../../core/models/cita.model';

export interface CitaEnfermeroItem extends Cita {
  tieneTriaje: boolean;
}

@Component({
  selector: 'app-citas-enfermero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './citas-enfermero.component.html',
  styleUrl: './citas-enfermero.component.scss'
})
export class CitasEnfermeroComponent implements OnInit {
  private citasService = inject(CitasService);
  private triajeService = inject(TriajeService);

  citas = signal<CitaEnfermeroItem[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');

  citasFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const lista = this.citas();
    if (!q) return lista;
    return lista.filter(c =>
      (c.pacienteNombre ?? '').toLowerCase().includes(q) ||
      (c.medicoNombre ?? '').toLowerCase().includes(q) ||
      (c.especialidadNombre ?? '').toLowerCase().includes(q) ||
      (c.estado ?? '').toLowerCase().includes(q) ||
      this.formatearFecha(c.fechaHora).includes(q)
    );
  });

  totalPendientesTriaje = computed(() =>
    this.citas().filter(c =>
      (c.estado === 'Reservada' || c.estado === 'Reprogramada') && !c.tieneTriaje
    ).length
  );

  totalConTriaje = computed(() => this.citas().filter(c => c.tieneTriaje).length);

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      citas: this.citasService.getTodas(),
      triajes: this.triajeService.getTriajes()
    }).subscribe({
      next: ({ citas, triajes }) => {
        const conTriaje = new Set(triajes.map(t => t.citaId));
        const items: CitaEnfermeroItem[] = citas
          .map(c => ({ ...c, tieneTriaje: conTriaje.has(c.id) }))
          .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));

        this.citas.set(items);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.status === 403
            ? 'No tiene permisos para consultar las citas.'
            : 'Error al cargar las citas. Intente nuevamente.'
        );
        this.cargando.set(false);
      }
    });
  }

  onBusqueda(event: Event) {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  limpiarBusqueda() {
    this.busqueda.set('');
  }

  formatearFecha(fechaHora: string): string {
    const [y, m, d] = (fechaHora ?? '').split('T')[0].split('-');
    return y && m && d ? `${d}/${m}/${y}` : (fechaHora ?? '');
  }

  formatearHora(fechaHora: string): string {
    const hora = (fechaHora ?? '').split('T')[1] ?? '';
    return hora.substring(0, 5) || '—';
  }
}

