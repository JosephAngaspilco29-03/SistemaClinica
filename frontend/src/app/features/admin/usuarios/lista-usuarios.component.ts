import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { UsuarioService } from '../../../core/services/usuario.service';
import { MedicoService } from '../../../core/services/medico.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { UsuarioListado } from '../../../core/models/usuario.model';
import { Medico } from '../../../core/models/medico.model';

/** Sin espacios al inicio ni al final. */
function sinEspaciosExtremos(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string;
  return v && v !== v.trim() ? { espaciosExtremos: true } : null;
}

/** Contraseña y confirmación iguales; médico obligatorio cuando el rol es Medico. */
function validarCuenta(group: AbstractControl): ValidationErrors | null {
  const errores: ValidationErrors = {};
  if (group.get('password')?.value !== group.get('confirmPassword')?.value) {
    errores['passwordMismatch'] = true;
  }
  if (group.get('rol')?.value === 'Medico' && !group.get('medicoId')?.value) {
    errores['medicoRequerido'] = true;
  }
  return Object.keys(errores).length ? errores : null;
}

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.scss'
})
export class ListaUsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private medicoService = inject(MedicoService);
  private pacienteService = inject(PacienteService);
  private fb = inject(FormBuilder);

  usuarios = signal<UsuarioListado[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');

  // Formulario de creación
  mostrarFormulario = signal(false);
  guardando = signal(false);
  errorServidor = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  cargandoMedicos = signal(false);
  medicos = signal<Medico[]>([]);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  form = this.fb.group({
    nombreUsuario: ['', [Validators.required, Validators.maxLength(100), sinEspaciosExtremos]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    confirmPassword: ['', [Validators.required]],
    rol: ['Medico' as 'Medico' | 'Enfermero', [Validators.required]],
    medicoId: [null as number | null]
  }, { validators: validarCuenta });

  /** Médicos activos que todavía no tienen una cuenta. */
  medicosDisponibles = computed(() => {
    const conCuenta = new Set(this.usuarios().filter(u => u.medicoId != null).map(u => u.medicoId));
    return this.medicos().filter(m => m.activo && !conCuenta.has(m.id));
  });

  // Nombres de médicos y pacientes por id (carga opcional: si falla, se muestra solo el id)
  private nombresMedicos = signal<Record<number, string>>({});
  private nombresPacientes = signal<Record<number, string>>({});

  usuariosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.usuarios();
    return this.usuarios().filter(u =>
      u.nombreUsuario.toLowerCase().includes(q) ||
      u.rol.toLowerCase().includes(q) ||
      this.asociado(u).toLowerCase().includes(q)
    );
  });

  totalActivos = computed(() => this.usuarios().filter(u => u.activo).length);
  totalInactivos = computed(() => this.usuarios().filter(u => !u.activo).length);

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
        this.cargarNombresAsociados(data);
      },
      error: (err) => {
        this.error.set(
          err?.status === 403
            ? 'No tiene permisos para ver los usuarios.'
            : 'Error al cargar los usuarios. Intente nuevamente.'
        );
        this.cargando.set(false);
      }
    });
  }

  private cargarNombresAsociados(data: UsuarioListado[]) {
    if (data.some(u => u.medicoId != null)) {
      this.medicoService.getMedicos().pipe(catchError(() => of([] as Medico[]))).subscribe(lista => {
        this.medicos.set(lista);
        this.actualizarNombresMedicos(lista);
      });
    }
    if (data.some(u => u.pacienteId != null)) {
      this.pacienteService.getPacientes().pipe(catchError(() => of([]))).subscribe(lista => {
        const mapa: Record<number, string> = {};
        lista.forEach(p => (mapa[p.id] = `${p.nombres} ${p.apellidos}`));
        this.nombresPacientes.set(mapa);
      });
    }
  }

  private actualizarNombresMedicos(lista: Medico[]) {
    const mapa: Record<number, string> = {};
    lista.forEach(m => (mapa[m.id] = `Dr. ${m.nombres} ${m.apellidos}`));
    this.nombresMedicos.set(mapa);
  }

  // ── Creación de usuario ──
  abrirFormulario() {
    this.form.reset({ nombreUsuario: '', password: '', confirmPassword: '', rol: 'Medico', medicoId: null });
    this.errorServidor.set(null);
    this.mostrarFormulario.set(true);

    // Siempre se refresca la lista de médicos para ofrecer solo los activos y sin cuenta
    this.cargandoMedicos.set(true);
    this.medicoService.getMedicos().subscribe({
      next: (lista) => {
        this.medicos.set(lista);
        this.actualizarNombresMedicos(lista);
        this.cargandoMedicos.set(false);
      },
      error: () => {
        this.errorServidor.set('No se pudo cargar la lista de médicos.');
        this.cargandoMedicos.set(false);
      }
    });
  }

  cerrarFormulario() {
    if (this.guardando()) return;
    this.form.reset({ nombreUsuario: '', password: '', confirmPassword: '', rol: 'Medico', medicoId: null });
    this.mostrarFormulario.set(false);
  }

  cambiarRol() {
    // Enfermero no lleva persona asociada
    if (this.form.controls.rol.value !== 'Medico') {
      this.form.controls.medicoId.setValue(null);
    }
  }

  campoInvalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  guardarUsuario() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.errorServidor.set(null);

    this.usuarioService.crearUsuario({
      nombreUsuario: v.nombreUsuario!,
      password: v.password!,
      rol: v.rol!,
      medicoId: v.rol === 'Medico' ? v.medicoId : null
    }).subscribe({
      next: (creado) => {
        this.guardando.set(false);
        // No se conserva la contraseña en memoria
        this.form.reset({ nombreUsuario: '', password: '', confirmPassword: '', rol: 'Medico', medicoId: null });
        this.mostrarFormulario.set(false);
        this.usuarios.update(lista => [...lista, creado]
          .sort((a, b) => a.nombreUsuario.localeCompare(b.nombreUsuario)));
        this.mostrarMensaje(`Usuario "${creado.nombreUsuario}" creado correctamente.`);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorServidor.set(this.mensajeError(err));
      }
    });
  }

  private mensajeError(err: any): string {
    if (err?.status === 0) return 'No se pudo conectar con el servidor.';
    if (err?.status === 401) return 'Su sesión ha expirado. Inicie sesión nuevamente.';
    if (err?.status === 403) return 'No tiene permisos para crear usuarios.';

    const body = err?.error;
    if (body?.mensaje) return body.mensaje;
    if (body?.errors) {
      const msgs = Object.values(body.errors).flat() as string[];
      if (msgs.length) return msgs.join(' ');
    }
    return 'Ocurrió un error al crear el usuario. Intente nuevamente.';
  }

  private mostrarMensaje(mensaje: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.mensajeExito.set(mensaje);
    this.toastTimer = setTimeout(() => this.mensajeExito.set(null), 5000);
  }

  /** Texto del médico o paciente asociado; cadena vacía si no tiene. */
  asociado(u: UsuarioListado): string {
    if (u.medicoId != null) {
      return this.nombresMedicos()[u.medicoId] ?? `Médico #${u.medicoId}`;
    }
    if (u.pacienteId != null) {
      return this.nombresPacientes()[u.pacienteId] ?? `Paciente #${u.pacienteId}`;
    }
    return '';
  }

  tipoAsociado(u: UsuarioListado): string {
    return u.medicoId != null ? 'Médico' : u.pacienteId != null ? 'Paciente' : '';
  }

  onBusqueda(event: Event) {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  limpiarBusqueda() {
    this.busqueda.set('');
  }
}

