import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';

import { CitasService } from '../../../core/services/citas.service';
import { TriajeService } from '../../../core/services/triaje.service';
import { AtencionMedicaService } from '../../../core/services/atencion-medica.service';
import { AsFormGroupPipe } from '../../../core/pipes/as-form-group.pipe';

import { Cita } from '../../../core/models/cita.model';
import { Triaje } from '../../../core/models/triaje.model';
import { AtencionMedica, CrearAtencionMedicaDto } from '../../../core/models/atencion-medica.model';

import { formatTime } from '../../../core/utils/time.utils';

export interface CitaExtendida extends Cita {
  triaje?: Triaje;
  atencion?: AtencionMedica;
}

@Component({
  selector: 'app-atenciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AsFormGroupPipe],
  templateUrl: './atenciones.component.html',
  styleUrl: './atenciones.component.scss'
})
export class AtencionesComponent implements OnInit {
  private citasService = inject(CitasService);
  private triajeService = inject(TriajeService);
  private atencionService = inject(AtencionMedicaService);
  private fb = inject(FormBuilder);

  // State
  citas = signal<CitaExtendida[]>([]);
  loading = signal(true);
  error = signal(false);
  filtro = signal<'Todas' | 'Pendientes' | 'Atendidas'>('Todas');

  // Formulario
  citaSeleccionada = signal<CitaExtendida | null>(null);
  showFormulario = signal(false);
  showConfirmacion = signal(false);
  guardando = signal(false);
  errorGuardado = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  atencionForm: FormGroup = this.fb.group({
    anamnesis: ['', Validators.required],
    examenFisico: ['', Validators.required],
    indicaciones: ['', Validators.required],
    observaciones: ['']
  });

  diagnosticosForm: FormGroup = this.fb.group({
    items: this.fb.array([])
  });

  get diagnosticosArray(): FormArray {
    return this.diagnosticosForm.get('items') as FormArray;
  }

  citasFiltradas = computed(() => {
    const lista = this.citas();
    const f = this.filtro();
    if (f === 'Pendientes') return lista.filter(c => this.puedeAtender(c));
    if (f === 'Atendidas') return lista.filter(c => c.estado === 'Atendida');
    return lista.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.error.set(false);

    forkJoin({
      citas: this.citasService.getMisCitas(),
      triajes: this.triajeService.getTriajes().pipe(catchError(() => of([]))),
      atenciones: this.atencionService.getAtenciones().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ citas, triajes, atenciones }) => {
        const extendidas: CitaExtendida[] = citas.map(c => ({
          ...c,
          triaje: triajes.find(t => t.citaId === c.id),
          atencion: atenciones.find(a => a.citaId === c.id)
        }));
        this.citas.set(extendidas);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  // Helpers de fecha/hora
  esCitaDeHoy(fechaIso: string): boolean {
    const citaStr = fechaIso.split('T')[0];
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    return citaStr === hoyStr;
  }

  esCitaFutura(fechaIso: string): boolean {
    return new Date(fechaIso) > new Date();
  }

  formatTimeUi(fechaHoraIso: string): string {
    const time = fechaHoraIso.includes('T') ? fechaHoraIso.split('T')[1] : fechaHoraIso;
    return formatTime(time);
  }

  getFechaFormateada(fechaIso: string): string {
    const [y, m, d] = fechaIso.split('T')[0].split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    return `${dias[date.getDay()]}, ${String(d).padStart(2,'0')} de ${meses[m-1]} de ${y}`;
  }

  getFechaCorta(fechaIso: string): string {
    const [y, m, d] = fechaIso.split('T')[0].split('-').map(Number);
    return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
  }

  // Lógica de elegibilidad
  puedeAtender(cita: CitaExtendida): boolean {
    return (
      (cita.estado === 'Reservada' || cita.estado === 'Reprogramada') &&
      this.esCitaDeHoy(cita.fechaHora) &&
      !!cita.triaje &&
      !cita.atencion
    );
  }

  getEstadoBadge(cita: CitaExtendida): { label: string; clase: string } {
    if (cita.atencion) return { label: 'ATENDIDA', clase: 'badge-success' };
    if (cita.estado === 'Cancelada') return { label: 'CANCELADA', clase: 'badge-danger' };
    if (cita.estado === 'Atendida') return { label: 'ATENDIDA', clase: 'badge-success' };
    if (!this.esCitaDeHoy(cita.fechaHora)) {
      const esFutura = new Date(cita.fechaHora) > new Date();
      return { label: esFutura ? 'PROGRAMADA' : 'PASADA', clase: esFutura ? 'badge-info' : 'badge-secondary' };
    }
    if (!cita.triaje) return { label: 'TRIAJE PENDIENTE', clase: 'badge-warning' };
    return { label: 'LISTA PARA ATENDER', clase: 'badge-primary' };
  }

  // Filtros
  cambiarFiltro(f: 'Todas' | 'Pendientes' | 'Atendidas') {
    this.filtro.set(f);
  }

  // Formulario
  crearDiagnosticoGroup(): FormGroup {
    return this.fb.group({
      codigoCie10: ['', [Validators.required, Validators.maxLength(10)]],
      descripcion: ['', Validators.required],
      principal: [false]
    });
  }

  abrirFormulario(cita: CitaExtendida) {
    this.citaSeleccionada.set(cita);
    this.atencionForm.reset({ anamnesis: '', examenFisico: '', indicaciones: '', observaciones: '' });
    this.diagnosticosArray.clear();
    this.agregarDiagnostico(); // siempre arrancar con uno vacío
    // marcar el primero como principal
    this.diagnosticosArray.at(0).get('principal')?.setValue(true);
    this.errorGuardado.set(null);
    this.showFormulario.set(true);
  }

  cerrarFormulario() {
    if (this.guardando()) return;
    this.showFormulario.set(false);
    this.citaSeleccionada.set(null);
  }

  agregarDiagnostico() {
    this.diagnosticosArray.push(this.crearDiagnosticoGroup());
  }

  eliminarDiagnostico(i: number) {
    if (this.diagnosticosArray.length === 1) return;
    this.diagnosticosArray.removeAt(i);
    // si el eliminado era principal, marcar el primero
    const hayPrincipal = this.diagnosticosArray.controls.some(c => c.get('principal')?.value);
    if (!hayPrincipal) {
      this.diagnosticosArray.at(0).get('principal')?.setValue(true);
    }
  }

  marcarPrincipal(idx: number) {
    this.diagnosticosArray.controls.forEach((ctrl, i) => {
      ctrl.get('principal')?.setValue(i === idx);
    });
  }

  formularioValido(): boolean {
    if (this.atencionForm.invalid) return false;
    if (this.diagnosticosArray.length === 0) return false;
    if (this.diagnosticosArray.controls.some(c => c.invalid)) return false;
    const hayPrincipal = this.diagnosticosArray.controls.some(c => c.get('principal')?.value === true);
    return hayPrincipal;
  }

  solicitarConfirmacion() {
    if (!this.formularioValido()) {
      this.atencionForm.markAllAsTouched();
      this.diagnosticosArray.controls.forEach(c => (c as FormGroup).markAllAsTouched());
      return;
    }
    this.showConfirmacion.set(true);
  }

  cancelarConfirmacion() {
    this.showConfirmacion.set(false);
  }

  guardarAtencion() {
    const cita = this.citaSeleccionada();
    if (!cita || this.guardando()) return;

    this.guardando.set(true);
    this.errorGuardado.set(null);

    const formVal = this.atencionForm.value;
    const dto: CrearAtencionMedicaDto = {
      citaId: cita.id,
      anamnesis: formVal.anamnesis,
      examenFisico: formVal.examenFisico,
      indicaciones: formVal.indicaciones,
      observaciones: formVal.observaciones || '',
      diagnosticos: this.diagnosticosArray.value.map((d: any) => ({
        codigoCie10: d.codigoCie10,
        descripcion: d.descripcion,
        principal: d.principal
      }))
    };

    this.atencionService.crearAtencion(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.showConfirmacion.set(false);
        this.showFormulario.set(false);
        this.mostrarExito('Atención médica registrada correctamente. La cita fue marcada como Atendida.');
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando.set(false);
        this.showConfirmacion.set(false);
        this.errorGuardado.set(err.error?.mensaje || 'Ocurrió un error al registrar la atención médica.');
      }
    });
  }

  mostrarExito(msg: string) {
    this.mensajeExito.set(msg);
    setTimeout(() => this.mensajeExito.set(null), 5000);
  }

  getEstadoCitaBadge(estado: string): string {
    switch (estado) {
      case 'Reservada': return 'badge-primary';
      case 'Reprogramada': return 'badge-info';
      case 'Atendida': return 'badge-success';
      case 'Cancelada': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }
}
