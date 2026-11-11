import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { PacienteService } from '../../../core/services/paciente.service';
import { Paciente, CrearPacienteRequest, ActualizarPacienteRequest } from '../../../core/models/paciente.model';

// ── Tipos internos ──────────────────────────────────────────────────────────
type Modo  = 'crear' | 'editar';
type Toast = { tipo: 'exito' | 'error'; mensaje: string };

@Component({
  selector: 'app-lista-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lista-pacientes.component.html',
  styleUrl: './lista-pacientes.component.scss'
})
export class ListaPacientesComponent implements OnInit {
  private pacienteService = inject(PacienteService);
  private fb = inject(FormBuilder);

  // ── Estado lista ────────────────────────────────────────────────────────────
  pacientes    = signal<Paciente[]>([]);
  cargando     = signal(true);
  error        = signal<string | null>(null);
  busqueda     = signal('');

  // ── Estado drawer ───────────────────────────────────────────────────────────
  drawerAbierto    = signal(false);
  modo             = signal<Modo>('crear');
  pacienteEditando = signal<Paciente | null>(null);
  guardando        = signal(false);
  toast            = signal<Toast | null>(null);

  // ── Filtrado reactivo ───────────────────────────────────────────────────────
  pacientesFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.pacientes();
    return this.pacientes().filter(p =>
      `${p.nombres} ${p.apellidos}`.toLowerCase().includes(q) ||
      p.documentoIdentidad.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  // ── Stats ───────────────────────────────────────────────────────────────────
  totalActivos   = computed(() => this.pacientes().filter(p => p.activo).length);
  totalInactivos = computed(() => this.pacientes().filter(p => !p.activo).length);

  // ── Formulario reactivo ─────────────────────────────────────────────────────
  form = this.fb.group({
    nombres:            ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    apellidos:          ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    documentoIdentidad: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
    fechaNacimiento:    ['', [Validators.required, this.fechaNacimientoValidator]],
    sexo:               ['', Validators.required],
    telefono:           ['', [Validators.maxLength(20)]],
    email:              ['', [Validators.email, Validators.maxLength(150)]],
    direccion:          ['', [Validators.maxLength(250)]],
    activo:             [true],
  });

  // ── Validador custom: fecha no futura ni >150 años ──────────────────────────
  private fechaNacimientoValidator(ctrl: AbstractControl) {
    if (!ctrl.value) return null;
    const val = new Date(ctrl.value);
    const hoy = new Date();
    const min = new Date();
    min.setFullYear(hoy.getFullYear() - 150);
    if (val > hoy) return { fechaFutura: true };
    if (val < min) return { fechaMuyAntigua: true };
    return null;
  }

  ngOnInit() {
    this.cargarPacientes();
  }

  // ── Lista ───────────────────────────────────────────────────────────────────
  cargarPacientes() {
    this.cargando.set(true);
    this.error.set(null);

    this.pacienteService.getPacientes().subscribe({
      next: (data) => {
        this.pacientes.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        const msg = err?.status === 403
          ? 'No tiene permisos para ver la lista de pacientes.'
          : 'Error al cargar los pacientes. Intente nuevamente.';
        this.error.set(msg);
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

  // ── Drawer: CREAR ───────────────────────────────────────────────────────────
  abrirDrawer() {
    this.modo.set('crear');
    this.pacienteEditando.set(null);
    this.form.reset({ activo: true });
    this.form.get('documentoIdentidad')!.enable();
    this.drawerAbierto.set(true);
  }

  // ── Drawer: EDITAR ──────────────────────────────────────────────────────────
  abrirEditar(paciente: Paciente) {
    this.modo.set('editar');
    this.pacienteEditando.set(paciente);

    const fecha = paciente.fechaNacimiento
      ? paciente.fechaNacimiento.substring(0, 10)
      : '';

    // Normaliza sexo: el backend puede devolver "M"/"F" o "Masculino"/"Femenino".
    // El <select> usa value="M" / value="F", por lo que se mapea a código corto.
    const sexoNorm = this.normalizarSexo(paciente.sexo);

    this.form.reset({
      nombres:            paciente.nombres,
      apellidos:          paciente.apellidos,
      documentoIdentidad: paciente.documentoIdentidad,
      fechaNacimiento:    fecha,
      sexo:               sexoNorm,
      telefono:           paciente.telefono ?? '',
      email:              paciente.email ?? '',
      direccion:          paciente.direccion ?? '',
      activo:             paciente.activo,
    });

    // El backend no permite cambiar el documento en PUT
    this.form.get('documentoIdentidad')!.disable();

    this.drawerAbierto.set(true);
  }

  /** Convierte cualquier variante del sexo al código corto "M" o "F".
   *  Acepta: "M", "Masculino", "masculino", "F", "Femenino", "femenino", etc. */
  private normalizarSexo(sexo: string): string {
    if (!sexo) return '';
    const s = sexo.trim().toUpperCase();
    if (s === 'M' || s.startsWith('MAS')) return 'M';
    if (s === 'F' || s.startsWith('FEM')) return 'F';
    return sexo; // valor desconocido: lo deja pasar para que el usuario corrija
  }

  cerrarDrawer() {
    if (this.guardando()) return;
    this.drawerAbierto.set(false);
    this.form.reset();
    this.pacienteEditando.set(null);
  }

  // ── Guardar (POST o PUT segun modo) ────────────────────────────────────────
  guardar() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.guardando()) return;

    this.guardando.set(true);
    const v = this.form.getRawValue();

    if (this.modo() === 'crear') {
      this.ejecutarCrear(v);
    } else {
      this.ejecutarEditar(v);
    }
  }

  private ejecutarCrear(v: ReturnType<typeof this.form.getRawValue>) {
    const payload: CrearPacienteRequest = {
      nombres:            (v.nombres ?? '').trim(),
      apellidos:          (v.apellidos ?? '').trim(),
      documentoIdentidad: (v.documentoIdentidad ?? '').trim(),
      fechaNacimiento:    v.fechaNacimiento ?? '',
      sexo:               v.sexo ?? '',
      telefono:           (v.telefono ?? '').trim(),
      email:              (v.email ?? '').trim(),
      direccion:          (v.direccion ?? '').trim(),
    };

    this.pacienteService.crearPaciente(payload).subscribe({
      next: (nuevo) => {
        this.pacientes.update(list => [nuevo, ...list]);
        this.guardando.set(false);
        this.cerrarDrawer();
        this.mostrarToast('exito', `Paciente "${nuevo.nombres} ${nuevo.apellidos}" registrado correctamente.`);
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err?.status === 409
          ? 'Ya existe un paciente con ese documento de identidad.'
          : err?.status === 403
            ? 'No tiene permisos para registrar pacientes.'
            : 'Ocurrio un error al guardar. Intente nuevamente.';
        this.mostrarToast('error', msg);
      }
    });
  }

  private ejecutarEditar(v: ReturnType<typeof this.form.getRawValue>) {
    const paciente = this.pacienteEditando()!;

    const payload: ActualizarPacienteRequest = {
      nombres:         (v.nombres ?? '').trim(),
      apellidos:       (v.apellidos ?? '').trim(),
      fechaNacimiento: v.fechaNacimiento ?? '',
      sexo:            v.sexo ?? '',
      telefono:        (v.telefono ?? '').trim(),
      email:           (v.email ?? '').trim(),
      direccion:       (v.direccion ?? '').trim(),
      activo:          v.activo ?? true,
    };

    this.pacienteService.actualizarPaciente(paciente.id, payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarDrawer();
        this.recargarPaciente(paciente.id);
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err?.status === 404
          ? 'El paciente ya no existe en el sistema.'
          : err?.status === 403
            ? 'No tiene permisos para editar pacientes.'
            : 'Error al actualizar. Intente nuevamente.';
        this.mostrarToast('error', msg);
      }
    });
  }

  /** Recarga el paciente del backend para verificar persistencia real. */
  private recargarPaciente(id: number) {
    this.pacienteService.getPacienteById(id).subscribe({
      next: (actualizado) => {
        this.pacientes.update(list =>
          list.map(p => p.id === id ? actualizado : p)
        );
        this.mostrarToast('exito',
          `Paciente "${actualizado.nombres} ${actualizado.apellidos}" actualizado correctamente.`);
      },
      error: () => {
        this.mostrarToast('exito', 'Paciente actualizado. No se pudo confirmar desde el servidor.');
      }
    });
  }

  // ── Toast ───────────────────────────────────────────────────────────────────
  private mostrarToast(tipo: Toast['tipo'], mensaje: string) {
    this.toast.set({ tipo, mensaje });
    setTimeout(() => this.toast.set(null), 5000);
  }

  cerrarToast() {
    this.toast.set(null);
  }

  // ── Helpers campo formulario ────────────────────────────────────────────────
  campo(name: string) {
    return this.form.get(name)!;
  }

  esInvalido(name: string): boolean {
    const c = this.campo(name);
    return c.invalid && (c.dirty || c.touched);
  }

  // ── Tabla ───────────────────────────────────────────────────────────────────
  calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  trackById(_: number, p: Paciente): number {
    return p.id;
  }
}