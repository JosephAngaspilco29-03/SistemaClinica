import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EspecialidadService } from '../../../core/services/especialidad.service';
import { Especialidad } from '../../../core/models/especialidad.model';

type Toast = { tipo: 'exito' | 'error'; mensaje: string };

@Component({
  selector: 'app-lista-especialidades',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './lista-especialidades.component.html',
  styleUrl: './lista-especialidades.component.scss'
})
export class ListaEspecialidadesComponent implements OnInit {
  private especialidadService = inject(EspecialidadService);
  private fb = inject(FormBuilder);

  // Formulario de registro
  mostrarFormulario = signal(false);
  especialidadEditando = signal<Especialidad | null>(null);
  especialidadConfirmandoEstado = signal<Especialidad | null>(null);
  procesandoEstado = signal(false);
  guardando = signal(false);
  errorServidor = signal<string | null>(null);
  toast = signal<Toast | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.maxLength(300)]]
  });

  especialidades = signal<Especialidad[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');

  especialidadesFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.especialidades();
    return this.especialidades().filter(e => e.nombre.toLowerCase().includes(q));
  });

  totalActivas = computed(() => this.especialidades().filter(e => e.activo).length);
  totalInactivas = computed(() => this.especialidades().filter(e => !e.activo).length);

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    this.especialidadService.getEspecialidades().subscribe({
      next: (data) => {
        this.especialidades.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.status === 403
            ? 'No tiene permisos para ver las especialidades.'
            : 'Error al cargar las especialidades. Intente nuevamente.'
        );
        this.cargando.set(false);
      }
    });
  }

  abrirFormulario(esp?: Especialidad) {
    this.especialidadEditando.set(esp ?? null);
    this.form.reset({ nombre: esp?.nombre ?? '', descripcion: esp?.descripcion ?? '' });
    this.errorServidor.set(null);
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario() {
    if (this.guardando()) return;
    this.mostrarFormulario.set(false);
    this.especialidadEditando.set(null);
  }

  campoInvalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  guardar() {
    const nombre = this.form.controls.nombre.value.trim();
    if (!nombre) {
      this.form.controls.nombre.setValue('');
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = { nombre, descripcion: this.form.controls.descripcion.value.trim() };

    const editando = this.especialidadEditando();

    // Evita un viaje al servidor si el nombre ya está en el listado cargado
    if (this.especialidades().some(e =>
      e.id !== editando?.id && e.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
      this.errorServidor.set('Ya existe una especialidad registrada con ese nombre.');
      return;
    }

    this.guardando.set(true);
    this.errorServidor.set(null);

    if (editando) {
      this.especialidadService.actualizarEspecialidad(editando.id, { ...dto, activo: editando.activo }).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarFormulario.set(false);
          this.especialidadEditando.set(null);
          // Reemplaza la fila en su sitio: sin duplicados y conservando el estado
          this.especialidades.update(lista =>
            lista.map(e => e.id === editando.id ? { ...e, ...dto } : e));
          this.mostrarToast(`Especialidad "${dto.nombre}" actualizada correctamente.`);
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorServidor.set(this.mensajeError(err, 'actualizar'));
        }
      });
      return;
    }

    this.especialidadService.crearEspecialidad(dto).subscribe({
      next: (creada) => {
        this.guardando.set(false);
        this.mostrarFormulario.set(false);
        // Actualiza listado y contadores sin recargar la página
        this.especialidades.update(lista => [...lista, creada]);
        this.mostrarToast(`Especialidad "${creada.nombre}" registrada correctamente.`);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorServidor.set(this.mensajeError(err));
      }
    });
  }

  // ── Activar / Desactivar especialidad (desactivación lógica) ──
  solicitarCambioEstado(esp: Especialidad) {
    this.especialidadConfirmandoEstado.set(esp);
  }

  cancelarCambioEstado() {
    if (this.procesandoEstado()) return;
    this.especialidadConfirmandoEstado.set(null);
  }

  confirmarCambioEstado() {
    const esp = this.especialidadConfirmandoEstado();
    if (!esp || this.procesandoEstado()) return;

    this.procesandoEstado.set(true);
    const nuevoEstado = !esp.activo;

    const peticion$ = nuevoEstado
      ? this.especialidadService.actualizarEspecialidad(esp.id, {
          nombre: esp.nombre,
          descripcion: esp.descripcion ?? '',
          activo: true
        })
      : this.especialidadService.desactivarEspecialidad(esp.id);

    peticion$.subscribe({
      next: () => {
        this.procesandoEstado.set(false);
        this.especialidadConfirmandoEstado.set(null);
        this.especialidades.update(lista =>
          lista.map(e => e.id === esp.id ? { ...e, activo: nuevoEstado } : e)
        );
        const accionTexto = nuevoEstado ? 'activada' : 'desactivada';
        this.mostrarToast(`Especialidad "${esp.nombre}" ${accionTexto} correctamente.`, 'exito');
      },
      error: (err) => {
        this.procesandoEstado.set(false);
        this.especialidadConfirmandoEstado.set(null);
        this.mostrarToast(this.mensajeError(err, 'actualizar'), 'error');
      }
    });
  }

  private mensajeError(err: any, accion: 'registrar' | 'actualizar' = 'registrar'): string {
    if (err?.status === 0) return 'No se pudo conectar con el servidor.';
    if (err?.status === 401) return 'Su sesión ha expirado. Inicie sesión nuevamente.';
    if (err?.status === 403) return `No tiene permisos para ${accion} especialidades.`;
    if (err?.status === 404) return 'La especialidad ya no existe. Cierre el formulario y actualice la lista.';

    const body = err?.error;
    if (body?.mensaje) return body.mensaje;
    if (body?.errors) {
      const msgs = Object.values(body.errors).flat() as string[];
      if (msgs.length) return msgs.join(' ');
    }
    return 'Ocurrió un error al registrar la especialidad. Intente nuevamente.';
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
}

