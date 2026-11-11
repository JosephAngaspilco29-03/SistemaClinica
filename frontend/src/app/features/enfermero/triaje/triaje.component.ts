import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CitasService } from '../../../core/services/citas.service';
import { TriajeService } from '../../../core/services/triaje.service';
import { Cita } from '../../../core/models/cita.model';
import { Triaje, CrearTriajeDto, ActualizarTriajeDto } from '../../../core/models/triaje.model';
import { formatTime } from '../../../core/utils/time.utils';
import { forkJoin } from 'rxjs';

export interface CitaTriaje extends Cita {
  triaje?: Triaje;
  estadoTriaje: 'PENDIENTE' | 'REGISTRADO';
}

@Component({
  selector: 'app-triaje',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './triaje.component.html',
  styleUrl: './triaje.component.scss'
})
export class TriajeComponent implements OnInit {
  private citasService = inject(CitasService);
  private triajeService = inject(TriajeService);
  private fb = inject(FormBuilder);

  citasTriaje = signal<CitaTriaje[]>([]);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);

  filtroActual = signal<string>('Todas');

  citasFiltradas = computed(() => {
    const lista = this.citasTriaje();
    const filtro = this.filtroActual();

    let filtradas = lista;
    if (filtro === 'Pendientes') {
      filtradas = lista.filter(c => c.estadoTriaje === 'PENDIENTE' && c.estado !== 'Cancelada');
    } else if (filtro === 'Con triaje') {
      filtradas = lista.filter(c => c.estadoTriaje === 'REGISTRADO');
    }

    return filtradas.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
  });

  showModal = signal<boolean>(false);
  selectedCita = signal<CitaTriaje | null>(null);
  guardando = signal<boolean>(false);
  errorOperacion = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  triajeForm: FormGroup = this.fb.group({
    presionSistolica: [0, [Validators.required, Validators.min(1)]],
    presionDiastolica: [0, [Validators.required, Validators.min(1)]],
    temperatura: [0, [Validators.required, Validators.min(1)]],
    frecuenciaCardiaca: [0, [Validators.required, Validators.min(1)]],
    peso: [0, [Validators.required, Validators.min(0.1)]],
    talla: [0, [Validators.required, Validators.min(0.1)]],
    observaciones: ['']
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.error.set(false);

    forkJoin({
      citas: this.citasService.getTodas(),
      triajes: this.triajeService.getTriajes()
    }).subscribe({
      next: ({ citas, triajes }) => {
        const mapeadas: CitaTriaje[] = citas.map(c => {
          const t = triajes.find(tr => tr.citaId === c.id);
          return {
            ...c,
            triaje: t,
            estadoTriaje: t ? 'REGISTRADO' : 'PENDIENTE'
          };
        });
        this.citasTriaje.set(mapeadas);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  cambiarFiltro(filtro: string) {
    this.filtroActual.set(filtro);
  }

  abrirModal(cita: CitaTriaje) {
    this.selectedCita.set(cita);
    this.errorOperacion.set(null);
    
    if (cita.triaje) {
      this.triajeForm.patchValue({
        presionSistolica: cita.triaje.presionSistolica,
        presionDiastolica: cita.triaje.presionDiastolica,
        temperatura: cita.triaje.temperatura,
        frecuenciaCardiaca: cita.triaje.frecuenciaCardiaca,
        peso: cita.triaje.peso,
        talla: cita.triaje.talla,
        observaciones: cita.triaje.observaciones
      });
    } else {
      this.triajeForm.reset({
        presionSistolica: 0,
        presionDiastolica: 0,
        temperatura: 0,
        frecuenciaCardiaca: 0,
        peso: 0,
        talla: 0,
        observaciones: ''
      });
    }

    this.showModal.set(true);
  }

  cerrarModal() {
    if (this.guardando()) return;
    this.showModal.set(false);
    this.selectedCita.set(null);
  }

  guardarTriaje() {
    if (this.triajeForm.invalid || !this.selectedCita()) return;

    this.guardando.set(true);
    this.errorOperacion.set(null);

    const cita = this.selectedCita()!;
    const formValues = this.triajeForm.value;

    if (cita.triaje) {
      const dto: ActualizarTriajeDto = {
        presionSistolica: formValues.presionSistolica,
        presionDiastolica: formValues.presionDiastolica,
        temperatura: formValues.temperatura,
        frecuenciaCardiaca: formValues.frecuenciaCardiaca,
        peso: formValues.peso,
        talla: formValues.talla,
        observaciones: formValues.observaciones || ''
      };

      this.triajeService.actualizarTriaje(cita.triaje.id, dto).subscribe({
        next: () => {
          this.guardando.set(false);
          this.showModal.set(false);
          this.mostrarExito('Triaje actualizado correctamente.');
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorOperacion.set(err.error?.mensaje || 'Ocurrió un error al actualizar el triaje.');
        }
      });
    } else {
      const dto: CrearTriajeDto = {
        citaId: cita.id,
        presionSistolica: formValues.presionSistolica,
        presionDiastolica: formValues.presionDiastolica,
        temperatura: formValues.temperatura,
        frecuenciaCardiaca: formValues.frecuenciaCardiaca,
        peso: formValues.peso,
        talla: formValues.talla,
        observaciones: formValues.observaciones || ''
      };

      this.triajeService.crearTriaje(dto).subscribe({
        next: () => {
          this.guardando.set(false);
          this.showModal.set(false);
          this.mostrarExito('Triaje registrado correctamente.');
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorOperacion.set(err.error?.mensaje || 'Ocurrió un error al registrar el triaje.');
        }
      });
    }
  }

  get imcPreview(): string | null {
    const peso = this.triajeForm.get('peso')?.value;
    const talla = this.triajeForm.get('talla')?.value;
    if (peso > 0 && talla > 0) {
      return (peso / (talla * talla)).toFixed(2);
    }
    return null;
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Reservada': return 'badge-primary';
      case 'Atendida': return 'badge-success';
      case 'Cancelada': return 'badge-danger';
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
    const fechaStr = fechaIso.split('T')[0];
    const [y, m, d] = fechaStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `${dias[dateObj.getDay()]}, ${String(d).padStart(2, '0')} de ${meses[dateObj.getMonth()]} de ${y}`;
  }

  getFechaCorta(fechaIso: string): string {
    const fechaStr = fechaIso.split('T')[0];
    const [y, m, d] = fechaStr.split('-').map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }

  esCitaDeHoy(fechaIso: string): boolean {
    const citaStr = fechaIso.split('T')[0];
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    const hoyStr = `${y}-${m}-${d}`;
    return citaStr === hoyStr;
  }

  mostrarExito(mensaje: string) {
    this.mensajeExito.set(mensaje);
    setTimeout(() => {
      this.mensajeExito.set(null);
    }, 4000);
  }
}
