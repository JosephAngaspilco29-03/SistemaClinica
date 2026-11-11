import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CitasService } from '../../../core/services/citas.service';
import { Cita, ReprogramarCitaDto } from '../../../core/models/cita.model';
import { HorarioMedicoService } from '../../../core/services/horario-medico.service';
import { HorarioMedico } from '../../../core/models/horario-medico.model';
import { formatTime } from '../../../core/utils/time.utils';

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-citas.component.html',
  styleUrl: './mis-citas.component.scss'
})
export class MisCitasComponent implements OnInit {
  private citasService = inject(CitasService);
  private horarioService = inject(HorarioMedicoService);

  citas = signal<Cita[]>([]);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);
  
  // Modals state
  selectedCita = signal<Cita | null>(null);
  
  // Cancel state
  showCancelModal = signal<boolean>(false);
  cancelando = signal<boolean>(false);
  
  // Reprogramar state
  showReprogramarModal = signal<boolean>(false);
  reprogramando = signal<boolean>(false);
  loadingHorarios = signal<boolean>(false);
  horariosDisponibles = signal<HorarioMedico[]>([]);
  selectedNuevoHorario = signal<HorarioMedico | null>(null);
  
  // Feedback
  mensajeExito = signal<string | null>(null);
  errorOperacion = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarCitas();
  }

  cargarCitas(): void {
    this.loading.set(true);
    this.error.set(false);
    
    this.citasService.getMisCitas().subscribe({
      next: (data) => {
        // Ordenar por fecha, más recientes o próximas primero (opcional, pero útil)
        const sortedData = data.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
        this.citas.set(sortedData);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
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

  // ---- CANCELAR CITA ----
  
  abrirModalCancelar(cita: Cita) {
    this.selectedCita.set(cita);
    this.errorOperacion.set(null);
    this.showCancelModal.set(true);
  }

  cerrarModalCancelar() {
    if (this.cancelando()) return;
    this.showCancelModal.set(false);
    this.selectedCita.set(null);
  }

  confirmarCancelacion() {
    const cita = this.selectedCita();
    if (!cita) return;

    this.cancelando.set(true);
    this.errorOperacion.set(null);

    this.citasService.cancelarCita(cita.id).subscribe({
      next: () => {
        this.cancelando.set(false);
        this.showCancelModal.set(false);
        this.mostrarExito('La cita fue cancelada correctamente.');
        this.cargarCitas();
      },
      error: (err) => {
        this.cancelando.set(false);
        this.errorOperacion.set(err.error?.mensaje || 'Error al cancelar la cita.');
      }
    });
  }

  // ---- REPROGRAMAR CITA ----

  abrirModalReprogramar(cita: Cita) {
    this.selectedCita.set(cita);
    this.selectedNuevoHorario.set(null);
    this.horariosDisponibles.set([]);
    this.errorOperacion.set(null);
    this.showReprogramarModal.set(true);
    this.cargarHorariosDisponibles(cita.medicoId);
  }

  cerrarModalReprogramar() {
    if (this.reprogramando()) return;
    this.showReprogramarModal.set(false);
    this.selectedCita.set(null);
  }

  cargarHorariosDisponibles(medicoId: number) {
    this.loadingHorarios.set(true);
    this.errorOperacion.set(null);

    this.horarioService.getHorarios().subscribe({
      next: (data) => {
        const hoyObj = new Date();
        const yyyy = hoyObj.getFullYear();
        const mm = String(hoyObj.getMonth() + 1).padStart(2, '0');
        const dd = String(hoyObj.getDate()).padStart(2, '0');
        const hoyStr = `${yyyy}-${mm}-${dd}`;

        const filtrados = data
          .filter(h => {
            if (!h.activo) return false;
            if (h.medicoId !== medicoId) return false;
            if (h.cuposDisponibles <= 0) return false;
            
            const hFechaStr = h.fecha.split('T')[0];
            if (hFechaStr < hoyStr) return false;
            
            // Si es exactamente el mismo horario actual, no tiene sentido seleccionarlo
            if (h.id === this.selectedCita()?.horarioMedicoId) return false;

            return true;
          })
          .sort((a, b) => {
            const dateA = a.fecha.split('T')[0];
            const dateB = b.fecha.split('T')[0];
            if (dateA !== dateB) return dateA.localeCompare(dateB);
            return a.horaInicio.localeCompare(b.horaInicio);
          });
          
        this.horariosDisponibles.set(filtrados);
        this.loadingHorarios.set(false);
      },
      error: () => {
        this.loadingHorarios.set(false);
        this.errorOperacion.set('Error al cargar los horarios del médico.');
      }
    });
  }

  seleccionarNuevoHorario(horario: HorarioMedico) {
    this.selectedNuevoHorario.set(horario);
  }

  confirmarReprogramacion() {
    const cita = this.selectedCita();
    const nuevoHorario = this.selectedNuevoHorario();
    
    if (!cita || !nuevoHorario) return;

    this.reprogramando.set(true);
    this.errorOperacion.set(null);

    const dto: ReprogramarCitaDto = {
      horarioMedicoId: nuevoHorario.id
    };

    this.citasService.reprogramarCita(cita.id, dto).subscribe({
      next: () => {
        this.reprogramando.set(false);
        this.showReprogramarModal.set(false);
        this.mostrarExito('La cita fue reprogramada correctamente.');
        this.cargarCitas();
      },
      error: (err) => {
        this.reprogramando.set(false);
        this.errorOperacion.set(err.error?.mensaje || 'Error al reprogramar la cita.');
        if (err.status === 409 || err.status === 404) {
          // Si hubo conflicto de cupos, recargar
          this.cargarHorariosDisponibles(cita.medicoId);
        }
      }
    });
  }

  // ---- HELPER ----

  mostrarExito(mensaje: string) {
    this.mensajeExito.set(mensaje);
    setTimeout(() => {
      this.mensajeExito.set(null);
    }, 4000);
  }
  
  // Computed helpers for HTML formatting
  getFechaFormateada(fechaIso: string): string {
    const fechaStr = fechaIso.split('T')[0];
    const [y, m, d] = fechaStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `${dias[dateObj.getDay()]}, ${d} de ${meses[dateObj.getMonth()]} de ${y}`;
  }

  formatTimeUi(timeString: string | undefined): string {
    if (!timeString) return '';
    const time = timeString.includes('T') ? timeString.split('T')[1] : timeString;
    return formatTime(time);
  }
}
