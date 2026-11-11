import { Component, OnInit, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { AuthService } from '../../core/services/auth.service';
import { PacienteService } from '../../core/services/paciente.service';
import { MedicoService } from '../../core/services/medico.service';
import { CitasService } from '../../core/services/citas.service';
import { ReporteService } from '../../core/services/reporte.service';
import { HistorialClinicoService } from '../../core/services/historial-clinico.service';
import { AtencionMedicaService } from '../../core/services/atencion-medica.service';
import { TriajeService } from '../../core/services/triaje.service';
import { EspecialidadService } from '../../core/services/especialidad.service';
import { Cita } from '../../core/models/cita.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatCardComponent, CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private pacienteService = inject(PacienteService);
  private medicoService = inject(MedicoService);
  private citasService = inject(CitasService);
  private reporteService = inject(ReporteService);
  private historialService = inject(HistorialClinicoService);
  private atencionService = inject(AtencionMedicaService);
  private triajeService = inject(TriajeService);
  private especialidadService = inject(EspecialidadService);

  get userName() { return this.authService.currentUser()?.nombreUsuario || 'Usuario'; }
  userRole = computed(() => this.authService.currentUser()?.rol || '');

  // Estado del Dashboard Administrador
  cargandoAdmin = signal(false);
  errorAdmin = signal<string | null>(null);
  adminCargado = signal(false);
  totalPacientes = signal<number | null>(null);
  medicosActivos = signal<number | null>(null);
  citasHoy = signal<number | null>(null);
  totalAtenciones = signal<number | null>(null);
  citasProximasAdmin = signal<Cita[]>([]);

  // Estado del Dashboard Médico
  cargandoMedico = signal(false);
  errorMedico = signal<string | null>(null);
  medicoCargado = signal(false);
  misPacientesCount = signal<number | null>(null);
  atencionesHoyMedico = signal<number | null>(null);
  citasPendientesMedico = signal<number | null>(null);
  miEspecialidad = signal<string | null>(null);
  citasProximasMedico = signal<Cita[]>([]);

  // Estado del Dashboard Enfermero
  cargandoEnfermero = signal(false);
  errorEnfermero = signal<string | null>(null);
  enfermeroCargado = signal(false);
  triajesPendientes = signal<number | null>(null);
  triajesRealizados = signal<number | null>(null);
  citasDelDiaEnfermero = signal<number | null>(null);
  especialidadesActivasEnfermero = signal<number | null>(null);
  citasProximasEnfermero = signal<Cita[]>([]);

  // Estado del Dashboard Paciente
  cargandoPaciente = signal(false);
  errorPaciente = signal<string | null>(null);
  pacienteCargado = signal(false);
  citasPendientesPaciente = signal<number | null>(null);
  atencionesHistorialPaciente = signal<number | null>(null);
  especialidadesDisponiblesPaciente = signal<number | null>(null);
  medicosDisponiblesPaciente = signal<number | null>(null);
  citasProximasPaciente = signal<Cita[]>([]);

  constructor() {
    effect(() => {
      const role = this.userRole();
      if (role === 'Administrador' && !this.adminCargado() && !this.cargandoAdmin()) {
        this.cargarDatosAdmin();
      } else if (role === 'Medico' && !this.medicoCargado() && !this.cargandoMedico()) {
        this.cargarDatosMedico();
      } else if (role === 'Enfermero' && !this.enfermeroCargado() && !this.cargandoEnfermero()) {
        this.cargarDatosEnfermero();
      } else if (role === 'Paciente' && !this.pacienteCargado() && !this.cargandoPaciente()) {
        this.cargarDatosPaciente();
      }
    });
  }

  ngOnInit() {
    const role = this.userRole();
    if (role === 'Administrador' && !this.adminCargado()) {
      this.cargarDatosAdmin();
    } else if (role === 'Medico' && !this.medicoCargado()) {
      this.cargarDatosMedico();
    } else if (role === 'Enfermero' && !this.enfermeroCargado()) {
      this.cargarDatosEnfermero();
    } else if (role === 'Paciente' && !this.pacienteCargado()) {
      this.cargarDatosPaciente();
    }
  }

  cargarDatosAdmin() {
    this.cargandoAdmin.set(true);
    this.errorAdmin.set(null);

    forkJoin({
      pacientes: this.pacienteService.getPacientes(),
      medicos: this.medicoService.getMedicos(),
      citas: this.citasService.getTodas(),
      atenciones: this.reporteService.getReporteAtenciones()
    }).subscribe({
      next: ({ pacientes, medicos, citas, atenciones }) => {
        const hoyStr = this.fechaHoyLocal();

        this.totalPacientes.set(pacientes.length);
        this.medicosActivos.set(medicos.filter(m => m.activo).length);
        this.totalAtenciones.set(atenciones.totalAtenciones);

        // Citas de hoy: fecha local igual a hoy y no canceladas
        const deHoy = citas.filter(c =>
          this.extraerFecha(c.fechaHora) === hoyStr && c.estado !== 'Cancelada'
        );
        this.citasHoy.set(deHoy.length);

        // Citas próximas: fecha >= hoy y en estado activo (Reservada o Reprogramada)
        const proximas = citas
          .filter(c =>
            this.extraerFecha(c.fechaHora) >= hoyStr &&
            (c.estado === 'Reservada' || c.estado === 'Reprogramada')
          )
          .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
          .slice(0, 6);

        this.citasProximasAdmin.set(proximas);
        this.adminCargado.set(true);
        this.cargandoAdmin.set(false);
      },
      error: (err) => {
        this.errorAdmin.set(
          err?.status === 403
            ? 'No tiene permisos para consultar el resumen administrativo.'
            : 'No se pudieron cargar los datos del panel. Verifique su conexión e intente nuevamente.'
        );
        this.cargandoAdmin.set(false);
      }
    });
  }

  cargarDatosMedico() {
    const medicoId = this.authService.currentUser()?.medicoId;
    if (!medicoId) {
      this.errorMedico.set('Tu cuenta de usuario no tiene un médico asociado.');
      return;
    }

    this.cargandoMedico.set(true);
    this.errorMedico.set(null);

    forkJoin({
      pacientes: this.historialService.obtenerMisPacientes(),
      atenciones: this.atencionService.getAtenciones(),
      citas: this.citasService.getMisCitas(),
      medico: this.medicoService.getMedicoById(medicoId)
    }).subscribe({
      next: ({ pacientes, atenciones, citas, medico }) => {
        const hoyStr = this.fechaHoyLocal();

        this.misPacientesCount.set(pacientes.length);

        const atencionesDeHoy = atenciones.filter(a =>
          this.extraerFecha(a.fechaAtencion) === hoyStr
        );
        this.atencionesHoyMedico.set(atencionesDeHoy.length);

        // Citas pendientes del médico (Reservada o Reprogramada)
        const pendientes = citas.filter(c =>
          c.estado === 'Reservada' || c.estado === 'Reprogramada'
        );
        this.citasPendientesMedico.set(pendientes.length);

        const espNombres = (medico.especialidades ?? []).map(e => e.nombre).join(', ');
        this.miEspecialidad.set(espNombres || 'Sin asignar');

        // Próximas citas reales del médico (fecha >= hoy y activas)
        const proximas = pendientes
          .filter(c => this.extraerFecha(c.fechaHora) >= hoyStr)
          .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
          .slice(0, 6);

        this.citasProximasMedico.set(proximas);
        this.medicoCargado.set(true);
        this.cargandoMedico.set(false);
      },
      error: (err) => {
        this.errorMedico.set(
          err?.status === 403
            ? 'No tiene permisos para consultar el panel médico.'
            : 'No se pudieron cargar tus datos médicos. Verifica tu conexión e intenta nuevamente.'
        );
        this.cargandoMedico.set(false);
      }
    });
  }

  cargarDatosEnfermero() {
    this.cargandoEnfermero.set(true);
    this.errorEnfermero.set(null);

    forkJoin({
      citas: this.citasService.getTodas(),
      triajes: this.triajeService.getTriajes(),
      especialidades: this.especialidadService.getEspecialidades()
    }).subscribe({
      next: ({ citas, triajes, especialidades }) => {
        const hoyStr = this.fechaHoyLocal();
        const citasConTriaje = new Set(triajes.map(t => t.citaId));

        // Citas que requieren triaje (estado activo Reservada o Reprogramada) y aún no tienen triaje registrado
        const pendientesDeTriaje = citas.filter(c =>
          (c.estado === 'Reservada' || c.estado === 'Reprogramada') &&
          !citasConTriaje.has(c.id)
        );
        this.triajesPendientes.set(pendientesDeTriaje.length);

        this.triajesRealizados.set(triajes.length);

        const delDia = citas.filter(c =>
          this.extraerFecha(c.fechaHora) === hoyStr && c.estado !== 'Cancelada'
        );
        this.citasDelDiaEnfermero.set(delDia.length);

        this.especialidadesActivasEnfermero.set(
          especialidades.filter(e => e.activo).length
        );

        // Próximas citas reales del sistema (fecha >= hoy y activas)
        const proximas = citas
          .filter(c =>
            this.extraerFecha(c.fechaHora) >= hoyStr &&
            (c.estado === 'Reservada' || c.estado === 'Reprogramada')
          )
          .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
          .slice(0, 6);

        this.citasProximasEnfermero.set(proximas);
        this.enfermeroCargado.set(true);
        this.cargandoEnfermero.set(false);
      },
      error: (err) => {
        this.errorEnfermero.set(
          err?.status === 403
            ? 'No tiene permisos para consultar el panel de enfermería.'
            : 'No se pudieron cargar los datos de enfermería. Verifica tu conexión e intenta nuevamente.'
        );
        this.cargandoEnfermero.set(false);
      }
    });
  }

  cargarDatosPaciente() {
    const pacienteId = this.authService.currentUser()?.pacienteId;
    if (!pacienteId) {
      this.errorPaciente.set('Tu cuenta de usuario no tiene un paciente asociado.');
      return;
    }

    this.cargandoPaciente.set(true);
    this.errorPaciente.set(null);

    forkJoin({
      citas: this.citasService.getMisCitas(),
      historial: this.historialService.obtenerHistorialPaciente(pacienteId),
      especialidades: this.especialidadService.getEspecialidades(),
      medicos: this.medicoService.getMedicos()
    }).subscribe({
      next: ({ citas, historial, especialidades, medicos }) => {
        const hoyStr = this.fechaHoyLocal();

        // Citas pendientes del paciente (Reservada o Reprogramada)
        const pendientes = citas.filter(c =>
          c.estado === 'Reservada' || c.estado === 'Reprogramada'
        );
        this.citasPendientesPaciente.set(pendientes.length);

        // Próximas citas del paciente (fecha >= hoy y en estado activo)
        const proximas = pendientes
          .filter(c => this.extraerFecha(c.fechaHora) >= hoyStr)
          .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));

        this.citasProximasPaciente.set(proximas.slice(0, 6));
        this.atencionesHistorialPaciente.set((historial.atenciones ?? []).length);
        this.especialidadesDisponiblesPaciente.set(especialidades.filter(e => e.activo).length);
        this.medicosDisponiblesPaciente.set(medicos.filter(m => m.activo).length);

        this.pacienteCargado.set(true);
        this.cargandoPaciente.set(false);
      },
      error: (err) => {
        this.errorPaciente.set(
          err?.status === 403
            ? 'No tienes permisos para consultar la información de tu panel.'
            : 'No se pudieron cargar tus datos. Verifica tu conexión e intenta nuevamente.'
        );
        this.cargandoPaciente.set(false);
      }
    });
  }

  /** Fecha local actual en formato YYYY-MM-DD. */
  private fechaHoyLocal(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  private extraerFecha(fechaHora: string): string {
    return (fechaHora ?? '').split('T')[0];
  }

  formatearFechaCita(fechaHora: string): string {
    const [y, m, d] = this.extraerFecha(fechaHora).split('-');
    return y && m && d ? `${d}/${m}/${y}` : '';
  }

  formatearHoraCita(fechaHora: string): string {
    const horaPart = (fechaHora ?? '').split('T')[1] ?? '';
    return horaPart.substring(0, 5) || '—';
  }

  statCards = computed(() => {
    const role = this.userRole();
    switch (role) {
      case 'Administrador':
        return [
          { title: 'Pacientes registrados', value: String(this.totalPacientes() ?? '—'), icon: 'group' },
          { title: 'Médicos activos', value: String(this.medicosActivos() ?? '—'), icon: 'medical_services' },
          { title: 'Citas hoy', value: String(this.citasHoy() ?? '—'), icon: 'calendar_today' },
          { title: 'Atenciones realizadas', value: String(this.totalAtenciones() ?? '—'), icon: 'assignment_turned_in' }
        ];
      case 'Medico':
        return [
          { title: 'Mis pacientes', value: String(this.misPacientesCount() ?? '—'), icon: 'people' },
          { title: 'Atenciones hoy', value: String(this.atencionesHoyMedico() ?? '—'), icon: 'assignment_turned_in' },
          { title: 'Citas pendientes', value: String(this.citasPendientesMedico() ?? '—'), icon: 'pending_actions' },
          { title: 'Especialidad', value: this.miEspecialidad() ?? '—', icon: 'favorite' }
        ];
      case 'Enfermero':
        return [
          { title: 'Triajes pendientes', value: String(this.triajesPendientes() ?? '—'), icon: 'monitor_heart' },
          { title: 'Triajes realizados', value: String(this.triajesRealizados() ?? '—'), icon: 'fact_check' },
          { title: 'Citas del día', value: String(this.citasDelDiaEnfermero() ?? '—'), icon: 'calendar_today' },
          { title: 'Especialidades activas', value: String(this.especialidadesActivasEnfermero() ?? '—'), icon: 'category' }
        ];
      case 'Paciente':
        return [
          { title: 'Mis citas pendientes', value: String(this.citasPendientesPaciente() ?? '—'), icon: 'event' },
          { title: 'Historial médico', value: String(this.atencionesHistorialPaciente() ?? '—'), icon: 'history' },
          { title: 'Especialidades', value: String(this.especialidadesDisponiblesPaciente() ?? '—'), icon: 'category' },
          { title: 'Médicos disponibles', value: String(this.medicosDisponiblesPaciente() ?? '—'), icon: 'medical_services' }
        ];
      default:
        return [];
    }
  });

  quickActions = computed(() => {
    const role = this.userRole();
    switch (role) {
      case 'Administrador':
        return [
          { label: 'Pacientes', icon: 'group', route: '/pacientes' },
          { label: 'Médicos', icon: 'medical_services', route: '/medicos' },
          { label: 'Horarios', icon: 'schedule', route: '/horarios' },
          { label: 'Reportes', icon: 'analytics', route: '/reportes' }
        ];
      case 'Medico':
        return [
          { label: 'Mi agenda', icon: 'calendar_today', route: '/agenda' },
          { label: 'Mi disponibilidad', icon: 'schedule', route: '/mi-disponibilidad' },
          { label: 'Atenciones', icon: 'assignment_turned_in', route: '/atenciones' },
          { label: 'Historial clínico', icon: 'history_edu', route: '/historial-medico' }
        ];
      case 'Enfermero':
        return [
          { label: 'Citas', icon: 'calendar_month', route: '/citas-enfermero' },
          { label: 'Registrar triaje', icon: 'monitor_heart', route: '/triaje' }
        ];
      case 'Paciente':
        return [
          { label: 'Reservar cita', icon: 'edit_calendar', route: '/reservar-cita' },
          { label: 'Mis citas', icon: 'event', route: '/mis-citas' },
          { label: 'Mi historial', icon: 'history', route: '/mi-historial' }
        ];
      default:
        return [];
    }
  });
}
