import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MedicoService } from '../../../core/services/medico.service';
import { EspecialidadService } from '../../../core/services/especialidad.service';
import { Medico } from '../../../core/models/medico.model';
import { Especialidad } from '../../../core/models/especialidad.model';

type Toast = { tipo: 'exito' | 'error'; mensaje: string };

@Component({
  selector: 'app-lista-medicos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lista-medicos.component.html',
  styleUrl: './lista-medicos.component.scss'
})
export class ListaMedicosComponent implements OnInit {
  private medicoService = inject(MedicoService);
  private especialidadService = inject(EspecialidadService);
  private fb = inject(FormBuilder);

  // Estado del formulario de registro
  mostrarFormulario = signal(false);
  medicoEditando    = signal<Medico | null>(null);
  medicoConfirmandoEstado = signal<Medico | null>(null);
  procesandoEstado  = signal(false);
  guardando         = signal(false);
  errorServidor     = signal<string | null>(null);
  especialidades    = signal<Especialidad[]>([]);
  cargandoEsp       = signal(false);
  toast             = signal<Toast | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  form = this.fb.nonNullable.group({
    nombres:           ['', [Validators.required, Validators.maxLength(100)]],
    apellidos:         ['', [Validators.required, Validators.maxLength(100)]],
    numeroColegiatura: ['', [Validators.required, Validators.maxLength(30)]],
    telefono:          ['', [Validators.maxLength(20)]],
    email:             ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    especialidadIds:   [[] as number[], [Validators.required, Validators.minLength(1)]]
  });

  // ── Estado lista ────────────────────────────────────────────────────────────
  medicos   = signal<Medico[]>([]);
  cargando  = signal(true);
  error     = signal<string | null>(null);
  busqueda  = signal('');

  // ── Filtrado reactivo ───────────────────────────────────────────────────────
  medicosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.medicos();
    return this.medicos().filter(m =>
      `${m.nombres} ${m.apellidos}`.toLowerCase().includes(q) ||
      m.numeroColegiatura.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.especialidades.some(e => e.nombre.toLowerCase().includes(q))
    );
  });

  // ── Stats ───────────────────────────────────────────────────────────────────
  totalActivos   = computed(() => this.medicos().filter(m => m.activo).length);
  totalInactivos = computed(() => this.medicos().filter(m => !m.activo).length);

  ngOnInit() {
    this.cargarMedicos();
  }

  cargarMedicos() {
    this.cargando.set(true);
    this.error.set(null);

    this.medicoService.getMedicos().subscribe({
      next: (data) => {
        this.medicos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        const msg = err?.status === 403
          ? 'No tiene permisos para ver la lista de médicos.'
          : 'Error al cargar los médicos. Intente nuevamente.';
        this.error.set(msg);
        this.cargando.set(false);
      }
    });
  }

  // ── Registro de nuevo médico ──
  abrirFormulario(medico?: Medico) {
    this.medicoEditando.set(medico ?? null);
    this.form.reset(medico
      ? {
          nombres: medico.nombres,
          apellidos: medico.apellidos,
          numeroColegiatura: medico.numeroColegiatura,
          telefono: medico.telefono ?? '',
          email: medico.email ?? '',
          especialidadIds: medico.especialidades.map(e => e.id)
        }
      : { especialidadIds: [] });
    this.errorServidor.set(null);
    this.mostrarFormulario.set(true);

    if (this.especialidades().length === 0) {
      this.cargandoEsp.set(true);
      this.especialidadService.getEspecialidades().subscribe({
        next: (data) => {
          this.especialidades.set(data);
          this.cargandoEsp.set(false);
        },
        error: () => {
          this.errorServidor.set('No se pudieron cargar las especialidades.');
          this.cargandoEsp.set(false);
        }
      });
    }
  }

  /** Especialidades visibles: las activas, más las ya asignadas al médico en edición. */
  especialidadesDisponibles = computed(() => {
    const asignadas = new Set(this.medicoEditando()?.especialidades.map(e => e.id) ?? []);
    return this.especialidades().filter(e => e.activo || asignadas.has(e.id));
  });

  cerrarFormulario() {
    if (this.guardando()) return;
    this.mostrarFormulario.set(false);
    this.medicoEditando.set(null);
  }

  esSeleccionada(id: number): boolean {
    return this.form.controls.especialidadIds.value.includes(id);
  }

  toggleEspecialidad(id: number) {
    const ctrl = this.form.controls.especialidadIds;
    const actual = ctrl.value;
    ctrl.setValue(actual.includes(id) ? actual.filter(x => x !== id) : [...actual, id]);
    ctrl.markAsTouched();
  }

  campoInvalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  guardarMedico() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const dto = {
      nombres: v.nombres.trim(),
      apellidos: v.apellidos.trim(),
      numeroColegiatura: v.numeroColegiatura.trim(),
      telefono: v.telefono.trim(),
      email: v.email.trim(),
      especialidadIds: v.especialidadIds
    };

    this.guardando.set(true);
    this.errorServidor.set(null);

    const editando = this.medicoEditando();
    if (editando) {
      this.medicoService.actualizarMedico(editando.id, { ...dto, activo: editando.activo }).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarFormulario.set(false);
          this.medicoEditando.set(null);
          this.mostrarToast('exito', `Médico Dr. ${dto.nombres} ${dto.apellidos} actualizado correctamente.`);
          this.cargarMedicos();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorServidor.set(this.mensajeError(err, 'actualizar'));
        }
      });
      return;
    }

    this.medicoService.crearMedico(dto).subscribe({
      next: (creado) => {
        this.guardando.set(false);
        this.mostrarFormulario.set(false);
        this.mostrarToast('exito', `Médico Dr. ${creado.nombres} ${creado.apellidos} registrado correctamente.`);
        this.cargarMedicos();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorServidor.set(this.mensajeError(err));
      }
    });
  }

  // ── Activar / Desactivar médico (desactivación lógica) ──
  solicitarCambioEstado(medico: Medico) {
    this.medicoConfirmandoEstado.set(medico);
  }

  cancelarCambioEstado() {
    if (this.procesandoEstado()) return;
    this.medicoConfirmandoEstado.set(null);
  }

  confirmarCambioEstado() {
    const medico = this.medicoConfirmandoEstado();
    if (!medico || this.procesandoEstado()) return;

    this.procesandoEstado.set(true);
    const nuevoEstado = !medico.activo;

    const peticion$ = nuevoEstado
      ? this.medicoService.actualizarMedico(medico.id, {
          nombres: medico.nombres,
          apellidos: medico.apellidos,
          numeroColegiatura: medico.numeroColegiatura,
          telefono: medico.telefono ?? '',
          email: medico.email ?? '',
          activo: true,
          especialidadIds: medico.especialidades.map(e => e.id)
        })
      : this.medicoService.desactivarMedico(medico.id);

    peticion$.subscribe({
      next: () => {
        this.procesandoEstado.set(false);
        this.medicoConfirmandoEstado.set(null);
        this.medicos.update(lista =>
          lista.map(m => m.id === medico.id ? { ...m, activo: nuevoEstado } : m)
        );
        const accionTexto = nuevoEstado ? 'activado' : 'desactivado';
        this.mostrarToast('exito', `Médico Dr. ${medico.nombres} ${medico.apellidos} ${accionTexto} correctamente.`);
      },
      error: (err) => {
        this.procesandoEstado.set(false);
        this.medicoConfirmandoEstado.set(null);
        this.mostrarToast('error', this.mensajeError(err, 'actualizar'));
      }
    });
  }

  private mensajeError(err: any, accion: 'registrar' | 'actualizar' = 'registrar'): string {
    if (err?.status === 0) return 'No se pudo conectar con el servidor.';
    if (err?.status === 401) return 'Su sesión ha expirado. Inicie sesión nuevamente.';
    if (err?.status === 403) return `No tiene permisos para ${accion} médicos.`;
    if (err?.status === 404) return 'El médico ya no existe. Cierre el formulario y actualice la lista.';

    const body = err?.error;
    if (body?.mensaje) return body.mensaje;
    if (body?.errors) {
      const msgs = Object.values(body.errors).flat() as string[];
      if (msgs.length) return msgs.join(' ');
    }
    if (typeof body?.detail === 'string') return body.detail;
    return 'Ocurrió un error al registrar el médico. Intente nuevamente.';
  }

  private mostrarToast(tipo: Toast['tipo'], mensaje: string) {
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

  /** Devuelve las iniciales del médico para el avatar. */
  iniciales(m: Medico): string {
    return `${m.nombres.charAt(0)}${m.apellidos.charAt(0)}`.toUpperCase();
  }

  trackById(_: number, m: Medico): number {
    return m.id;
  }
}
