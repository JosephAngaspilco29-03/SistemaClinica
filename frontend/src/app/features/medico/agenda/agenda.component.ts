import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CitasService } from '../../../core/services/citas.service';
import { Cita } from '../../../core/models/cita.model';
import { formatTime } from '../../../core/utils/time.utils';

interface AgrupacionCitas {
  fecha: string;
  fechaString: string;
  citas: Cita[];
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss'
})
export class AgendaComponent implements OnInit {
  private citasService = inject(CitasService);

  citas = signal<Cita[]>([]);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);
  
  filtroActual = signal<string>('Proximas');

  citasProximas = computed(() => this.filtrarCitasProximas(this.citas()).length);
  citasAtendidas = computed(() => this.citas().filter(c => c.estado === 'Atendida').length);
  citasCanceladas = computed(() => this.citas().filter(c => c.estado === 'Cancelada').length);

  citasAgrupadas = computed(() => {
    let citasFiltradas = this.citas();
    const filtro = this.filtroActual();

    if (filtro === 'Proximas') {
      citasFiltradas = this.filtrarCitasProximas(citasFiltradas);
    } else if (filtro === 'Atendidas') {
      citasFiltradas = citasFiltradas.filter(c => c.estado === 'Atendida');
    } else if (filtro === 'Canceladas') {
      citasFiltradas = citasFiltradas.filter(c => c.estado === 'Cancelada');
    }

    const citasOrdenadas = [...citasFiltradas].sort((a, b) => {
      const timeA = new Date(a.fechaHora).getTime();
      const timeB = new Date(b.fechaHora).getTime();
      return timeA - timeB; 
    });

    const agrupacion = new Map<string, AgrupacionCitas>();

    for (const cita of citasOrdenadas) {
      const fechaObj = new Date(cita.fechaHora);
      const y = fechaObj.getFullYear();
      const m = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const d = String(fechaObj.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      if (!agrupacion.has(dateStr)) {
        agrupacion.set(dateStr, {
          fecha: dateStr,
          fechaString: this.getFechaFormateada(dateStr),
          citas: []
        });
      }
      agrupacion.get(dateStr)!.citas.push(cita);
    }

    return Array.from(agrupacion.values());
  });

  ngOnInit(): void {
    this.cargarAgenda();
  }

  cargarAgenda(): void {
    this.loading.set(true);
    this.error.set(false);
    
    this.citasService.getMisCitas().subscribe({
      next: (data) => {
        this.citas.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  cambiarFiltro(nuevoFiltro: string): void {
    this.filtroActual.set(nuevoFiltro);
  }

  private filtrarCitasProximas(listaCitas: Cita[]): Cita[] {
    const ahora = new Date().getTime();
    
    return listaCitas.filter(c => 
      (c.estado === 'Reservada' || c.estado === 'Reprogramada') && 
      new Date(c.fechaHora).getTime() >= ahora
    );
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Reservada': return 'badge-primary';
      case 'Atendida': return 'badge-success';
      case 'Cancelada': return 'badge-danger';
      case 'Ausente': return 'badge-warning';
      case 'Reprogramada': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  formatTimeUi(fechaHoraIso: string): string {
    if (!fechaHoraIso) return '';
    const time = fechaHoraIso.includes('T') ? fechaHoraIso.split('T')[1] : fechaHoraIso;
    return formatTime(time);
  }

  getFechaFormateada(fechaIso: string): string {
    const [y, m, d] = fechaIso.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `${dias[dateObj.getDay()]} ${String(d).padStart(2, '0')} de ${meses[dateObj.getMonth()]} de ${y}`;
  }
}
