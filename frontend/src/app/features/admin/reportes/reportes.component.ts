import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ReporteService } from '../../../core/services/reporte.service';
import { ReporteAtencionItem, ReporteAusentismo } from '../../../core/models/reporte.model';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  private reporteService = inject(ReporteService);

  ausentismo = signal<ReporteAusentismo | null>(null);
  totalAtenciones = signal(0);
  atenciones = signal<ReporteAtencionItem[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');

  atencionesFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.atenciones();
    return this.atenciones().filter(a =>
      (a.pacienteNombre ?? '').toLowerCase().includes(q) ||
      (a.medicoNombre ?? '').toLowerCase().includes(q) ||
      (a.diagnosticoPrincipal ?? '').toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      ausentismo: this.reporteService.getReporteAusentismo(),
      atenciones: this.reporteService.getReporteAtenciones()
    }).subscribe({
      next: ({ ausentismo, atenciones }) => {
        this.ausentismo.set(ausentismo);
        this.totalAtenciones.set(atenciones.totalAtenciones);
        this.atenciones.set(atenciones.atenciones ?? []);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.status === 403
            ? 'No tiene permisos para ver los reportes.'
            : 'Error al cargar los reportes. Intente nuevamente.'
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

  /** Convierte "YYYY-MM-DDTHH:mm:ss" a "DD/MM/YYYY HH:mm" sin desfase de zona horaria. */
  formatearFechaHora(iso: string): string {
    if (!iso) return '—';
    const [fechaPart, horaPart] = iso.split('T');
    const [y, m, d] = (fechaPart ?? '').split('-');
    const fecha = y && m && d ? `${d}/${m}/${y}` : fechaPart;
    const hora = horaPart ? horaPart.substring(0, 5) : '';
    return hora && hora !== '00:00' ? `${fecha} ${hora}` : fecha;
  }
}

