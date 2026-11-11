import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HorarioMedicoService } from '../../../core/services/horario-medico.service';
import { MedicoService } from '../../../core/services/medico.service';
import { HorarioMedico } from '../../../core/models/horario-medico.model';
import { Medico } from '../../../core/models/medico.model';

type Toast = { tipo: 'exito' | 'error'; mensaje: string };

@Component({
  selector: 'app-lista-horarios',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './lista-horarios.component.html',
  styleUrl: './lista-horarios.component.scss'
})
export class ListaHorariosComponent implements OnInit {
  private horarioService = inject(HorarioMedicoService);
  private medicoService = inject(MedicoService);
  private fb = inject(FormBuilder);

  // Estado de formularios y modales
  mostrarFormulario = signal(false);
  horarioEditando = signal<HorarioMedico | null>(null);
  horarioConfirmandoEstado = signal<HorarioMedico | null>(null);
  procesandoEstado = signal(false);
  guardando = signal(false);
  errorServidor = signal<string | null>(null);
  toast = signal<Toast | null>(null);
  medicos = signal<Medico[]>([]);
  cargandoMedicos = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  medicosActivos = computed(() => this.medicos().filter(m => m.activo));

  form = this.fb.nonNullable.group({
    medicoId: [0, [Validators.min(1)]],
    fecha: ['', [Validators.required]],
    horaInicio: ['', [Validators.required]],
    horaFin: ['', [Validators.required]],
    cuposDisponibles: [1, [Validators.required, Validators.min(1), Validators.max(1000)]]
  });

  horarios = signal<HorarioMedico[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');

  horariosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.horarios();
    return this.horarios().filter(h => (h.medicoNombre ?? '').toLowerCase().includes(q));
  });

  totalActivos = computed(() => this.horarios().filter(h => !this.esVencido(h) && h.activo).length);
  totalInactivos = computed(() => this.horarios().filter(h => !this.esVencido(h) && !h.activo).length);
  totalVencidos = computed(() => this.horarios().filter(h => this.esVencido(h)).length);

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    this.horarioService.getHorarios().subscribe({
      next: (data) => {
        this.horarios.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.status === 403
            ? 'No tiene permisos para ver los horarios.'
            : 'Error al cargar los horarios. Intente nuevamente.'
        );
        this.cargando.set(false);
      }
    });
  }

  // ── Creación y edición de horario ──
  hoy(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  abrirFormulario(horario?: HorarioMedico) {
    this.horarioEditando.set(horario ?? null);
    this.errorServidor.set(null);

    if (horario) {
      this.form.reset({
        medicoId: horario.medicoId,
        fecha: (horario.fecha ?? '').split('T')[0],
        horaInicio: this.formatearHora(horario.horaInicio),
        horaFin: this.formatearHora(horario.horaFin),
        cuposDisponibles: horario.cuposDisponibles
      });
      this.mostrarFormulario.set(true);
      return;
    }

    this.form.reset({ medicoId: 0, fecha: this.hoy(), horaInicio: '', horaFin: '', cuposDisponibles: 1 });
    this.mostrarFormulario.set(true);

    if (this.medicos().length === 0) {
      this.cargandoMedicos.set(true);
      this.medicoService.getMedicos().subscribe({
        next: (data) => {
          this.medicos.set(data);
          this.cargandoMedicos.set(false);
        },
        error: () => {
          this.errorServidor.set('No se pudo cargar la lista de médicos.');
          this.cargandoMedicos.set(false);
        }
      });
    }
  }

  cerrarFormulario() {
    if (this.guardando()) return;
    this.mostrarFormulario.set(false);
    this.horarioEditando.set(null);
  }

  campoInvalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  /** Validaciones de negocio del formulario; devuelve el mensaje de error o null. */
  private validarNegocio(
    v: { medicoId: number; fecha: string; horaInicio: string; horaFin: string },
    excluirId?: number
  ): string | null {
    if (v.horaFin <= v.horaInicio) {
      return 'La hora de fin debe ser mayor que la hora de inicio.';
    }
    if (v.fecha < this.hoy()) {
      return 'No se puede registrar ni modificar un horario para una fecha pasada.';
    }
    if (v.fecha === this.hoy()) {
      const ahora = new Date();
      const hhmm = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
      if (v.horaFin <= hhmm) return 'No se puede guardar un horario que ya terminó hoy.';
    }
    const solapa = this.horarios().some(h =>
      h.id !== excluirId &&
      h.activo &&
      h.medicoId === Number(v.medicoId) &&
      h.fecha.split('T')[0] === v.fecha &&
      v.horaInicio < this.formatearHora(h.horaFin) &&
      v.horaFin > this.formatearHora(h.horaInicio));
    if (solapa) {
      return 'El médico ya tiene un horario activo que se solapa o duplica con el indicado.';
    }
    return null;
  }

  guardarHorario() {
    const editando = this.horarioEditando();

    if (editando?.tieneCitas) {
      this.errorServidor.set(
        'Este horario ya tiene citas asociadas. Para proteger las reservas, no es posible cambiar su fecha, horas ni cupos.'
      );
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const errorNegocio = this.validarNegocio(v, editando?.id);
    if (errorNegocio) {
      this.errorServidor.set(errorNegocio);
      return;
    }

    this.guardando.set(true);
    this.errorServidor.set(null);

    if (editando) {
      const dto = {
        fecha: v.fecha,
        horaInicio: `${v.horaInicio}:00`,
        horaFin: `${v.horaFin}:00`,
        cuposDisponibles: Number(v.cuposDisponibles),
        activo: editando.activo
      };

      this.horarioService.actualizarHorario(editando.id, dto).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarFormulario.set(false);
          this.horarioEditando.set(null);
          this.horarios.update(lista =>
            lista
              .map(h => h.id === editando.id ? { ...h, ...dto } : h)
              .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))
          );
          this.mostrarToast(`Horario de ${editando.medicoNombre} actualizado correctamente.`, 'exito');
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorServidor.set(this.mensajeError(err, 'actualizar'));
        }
      });
      return;
    }

    this.horarioService.crearHorario({
      medicoId: Number(v.medicoId),
      fecha: v.fecha,
      horaInicio: `${v.horaInicio}:00`,
      horaFin: `${v.horaFin}:00`,
      cuposDisponibles: Number(v.cuposDisponibles)
    }).subscribe({
      next: (creado) => {
        this.guardando.set(false);
        this.mostrarFormulario.set(false);
        this.horarios.update(lista => [...lista, creado].sort((a, b) =>
          a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio)));
        this.mostrarToast(`Horario de ${creado.medicoNombre} registrado correctamente.`, 'exito');
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorServidor.set(this.mensajeError(err, 'registrar'));
      }
    });
  }

  // ── Activar / Desactivar horario (desactivación lógica) ──
  solicitarCambioEstado(h: HorarioMedico) {
    this.horarioConfirmandoEstado.set(h);
  }

  cancelarCambioEstado() {
    if (this.procesandoEstado()) return;
    this.horarioConfirmandoEstado.set(null);
  }

  confirmarCambioEstado() {
    const h = this.horarioConfirmandoEstado();
    if (!h || this.procesandoEstado()) return;

    this.procesandoEstado.set(true);
    const nuevoEstado = !h.activo;

    const peticion$ = nuevoEstado
      ? this.horarioService.actualizarHorario(h.id, {
          fecha: h.fecha,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          cuposDisponibles: h.cuposDisponibles,
          activo: true
        })
      : this.horarioService.desactivarHorario(h.id);

    peticion$.subscribe({
      next: () => {
        this.procesandoEstado.set(false);
        this.horarioConfirmandoEstado.set(null);
        this.horarios.update(lista =>
          lista.map(item => item.id === h.id ? { ...item, activo: nuevoEstado } : item)
        );
        const accionTexto = nuevoEstado ? 'activado' : 'desactivado';
        this.mostrarToast(`Horario de ${h.medicoNombre} ${accionTexto} correctamente.`, 'exito');
      },
      error: (err) => {
        this.procesandoEstado.set(false);
        this.horarioConfirmandoEstado.set(null);
        this.mostrarToast(this.mensajeError(err, 'actualizar'), 'error');
      }
    });
  }

  private mensajeError(err: any, accion: 'registrar' | 'actualizar' = 'registrar'): string {
    if (err?.status === 0) return 'No se pudo conectar con el servidor.';
    if (err?.status === 401) return 'Su sesión ha expirado. Inicie sesión nuevamente.';
    if (err?.status === 403) return `No tiene permisos para ${accion} horarios.`;
    if (err?.status === 404) return 'El horario ya no existe. Actualice la lista.';

    const body = err?.error;
    if (body?.mensaje) return body.mensaje;
    if (body?.errors) {
      const msgs = Object.values(body.errors).flat() as string[];
      if (msgs.length) return msgs.join(' ');
    }
    return `Ocurrió un error al ${accion} el horario. Intente nuevamente.`;
  }

  private mostrarToast(mensaje: string, tipo: Toast['tipo'] = 'exito') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set({ tipo, mensaje });
    this.toastTimer = setTimeout(() => this.toast.set(null), 5000);
  }

  onBusqueda(event: Event) {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  limpiarBusqueda() {
    this.busqueda.set('');
  }

  /** Determina si la fecha y hora de fin del horario ya pasaron respecto al momento actual. */
  esVencido(h: HorarioMedico): boolean {
    const fechaHorario = (h.fecha ?? '').split('T')[0];
    if (!fechaHorario) return false;
    const fechaHoy = this.hoy();
    if (fechaHorario < fechaHoy) return true;
    if (fechaHorario === fechaHoy) {
      const ahora = new Date();
      const hhmm = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
      return this.formatearHora(h.horaFin) <= hhmm;
    }
    return false;
  }

  /** Devuelve el estado visual del horario ('Vencido', 'Activo' o 'Inactivo'). */
  estadoVisual(h: HorarioMedico): 'Vencido' | 'Activo' | 'Inactivo' {
    if (this.esVencido(h)) return 'Vencido';
    return h.activo ? 'Activo' : 'Inactivo';
  }

  /** Convierte "YYYY-MM-DDTHH:mm:ss" a "DD/MM/YYYY" sin pasar por Date (evita desfases de zona horaria). */
  formatearFecha(fecha: string): string {
    const [y, m, d] = (fecha ?? '').split('T')[0].split('-');
    return y && m && d ? `${d}/${m}/${y}` : (fecha ?? '');
  }

  /** Convierte "HH:mm:ss" a "HH:mm". */
  formatearHora(hora: string): string {
    return (hora ?? '').substring(0, 5);
  }
}
