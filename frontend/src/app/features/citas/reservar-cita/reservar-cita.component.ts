import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EspecialidadService } from '../../../core/services/especialidad.service';
import { MedicoService } from '../../../core/services/medico.service';
import { HorarioMedicoService } from '../../../core/services/horario-medico.service';

import { Especialidad } from '../../../core/models/especialidad.model';
import { Medico } from '../../../core/models/medico.model';
import { HorarioMedico } from '../../../core/models/horario-medico.model';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CitasService } from '../../../core/services/citas.service';
import { getTurno, formatTime } from '../../../core/utils/time.utils';

@Component({
  selector: 'app-reservar-cita',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservar-cita.component.html',
  styleUrl: './reservar-cita.component.scss'
})
export class ReservarCitaComponent implements OnInit {
  private especialidadService = inject(EspecialidadService);
  private medicoService = inject(MedicoService);
  private horarioService = inject(HorarioMedicoService);
  private authService = inject(AuthService);
  private citasService = inject(CitasService);
  private router = inject(Router);

  // Util functions for HTML template
  getTurno = getTurno;
  formatTime = formatTime;

  // Pasos: 1 = Especialidad, 2 = Médico, 3 = Horario, 4 = Resumen
  currentStep = signal<number>(1);

  // Datos
  todasEspecialidades = signal<Especialidad[]>([]);
  todosMedicos = signal<Medico[]>([]);
  todosHorarios = signal<HorarioMedico[]>([]);

  // Estados de carga
  loadingEspecialidades = signal<boolean>(true);
  loadingMedicos = signal<boolean>(false);
  loadingHorarios = signal<boolean>(false);

  // Errores
  errorEspecialidades = signal<boolean>(false);
  errorMedicos = signal<boolean>(false);
  errorHorarios = signal<boolean>(false);

  // Selecciones
  selectedEspecialidad = signal<Especialidad | null>(null);
  selectedMedico = signal<Medico | null>(null);
  selectedHorario = signal<HorarioMedico | null>(null);
  motivoConsulta = signal<string>('');

  reservando = signal<boolean>(false);
  reservaExitosa = signal<boolean>(false);
  errorReserva = signal<string | null>(null);

  selectedHorarioFormateado = computed(() => {
    const h = this.selectedHorario();
    if (!h) return '';
    const fechaStr = h.fecha.split('T')[0];
    const [y, m, d] = fechaStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `${dias[dateObj.getDay()]}, ${d} de ${meses[dateObj.getMonth()]} de ${y}`;
  });

  // Datos filtrados para la vista
  especialidadesActivas = computed(() => {
    return this.todasEspecialidades().filter(e => e.activo);
  });

  medicosFiltrados = computed(() => {
    const esp = this.selectedEspecialidad();
    if (!esp) return [];
    return this.todosMedicos().filter(m => 
      m.activo && 
      m.especialidades.some(e => e.id === esp.id)
    );
  });

  horariosFiltrados = computed(() => {
    const med = this.selectedMedico();
    if (!med) return [];
    
    // Comparación segura de fechas en formato YYYY-MM-DD
    const hoyObj = new Date();
    const yyyy = hoyObj.getFullYear();
    const mm = String(hoyObj.getMonth() + 1).padStart(2, '0');
    const dd = String(hoyObj.getDate()).padStart(2, '0');
    const hoyStr = `${yyyy}-${mm}-${dd}`;

    return this.todosHorarios()
      .filter(h => {
        if (!h.activo) return false;
        if (h.medicoId !== med.id) return false;
        
        // Evitar fallos de Timezone con new Date(h.fecha)
        const hFechaStr = h.fecha.split('T')[0];
        if (hFechaStr < hoyStr) return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = a.fecha.split('T')[0];
        const dateB = b.fecha.split('T')[0];
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return a.horaInicio.localeCompare(b.horaInicio);
      });
  });

  horariosAgrupadosPorFecha = computed(() => {
    const horarios = this.horariosFiltrados();
    const grupos: { fecha: string; fechaFormateada: string; horarios: HorarioMedico[] }[] = [];
    
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    
    horarios.forEach(h => {
      const fechaStr = h.fecha.split('T')[0];
      let grupoExistente = grupos.find(g => g.fecha === fechaStr);
      
      if (!grupoExistente) {
        // Parsear seguro sin timezone offset (local midnight)
        const [y, m, d] = fechaStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        
        const nombreDia = dias[dateObj.getDay()].toUpperCase();
        const nombreMes = meses[dateObj.getMonth()].toUpperCase();
        const fechaFormateada = `${nombreDia}, ${String(d).padStart(2, '0')} DE ${nombreMes}`;
        
        grupoExistente = { fecha: fechaStr, fechaFormateada, horarios: [] };
        grupos.push(grupoExistente);
      }
      
      grupoExistente.horarios.push(h);
    });

    return grupos;
  });

  ngOnInit() {
    this.cargarEspecialidades();
  }

  cargarEspecialidades() {
    this.loadingEspecialidades.set(true);
    this.errorEspecialidades.set(false);
    this.especialidadService.getEspecialidades().subscribe({
      next: (data) => {
        this.todasEspecialidades.set(data);
        this.loadingEspecialidades.set(false);
      },
      error: () => {
        this.errorEspecialidades.set(true);
        this.loadingEspecialidades.set(false);
      }
    });
  }

  cargarMedicos() {
    this.loadingMedicos.set(true);
    this.errorMedicos.set(false);
    this.medicoService.getMedicos().subscribe({
      next: (data) => {
        this.todosMedicos.set(data);
        this.loadingMedicos.set(false);
      },
      error: () => {
        this.errorMedicos.set(true);
        this.loadingMedicos.set(false);
      }
    });
  }

  cargarHorarios() {
    this.loadingHorarios.set(true);
    this.errorHorarios.set(false);
    this.horarioService.getHorarios().subscribe({
      next: (data) => {
        this.todosHorarios.set(data);
        this.loadingHorarios.set(false);
      },
      error: () => {
        this.errorHorarios.set(true);
        this.loadingHorarios.set(false);
      }
    });
  }

  // Acciones de selección
  seleccionarEspecialidad(esp: Especialidad) {
    if (this.selectedEspecialidad()?.id !== esp.id) {
      this.selectedEspecialidad.set(esp);
      this.selectedMedico.set(null);
      this.selectedHorario.set(null);
      
      if (this.todosMedicos().length === 0) {
        this.cargarMedicos();
      }
    }
  }

  seleccionarMedico(med: Medico) {
    if (this.selectedMedico()?.id !== med.id) {
      this.selectedMedico.set(med);
      this.selectedHorario.set(null);
    }
  }

  seleccionarHorario(horario: HorarioMedico) {
    this.selectedHorario.set(horario);
  }

  // Navegación
  goToStep(step: number) {
    if (step === 2 && !this.selectedEspecialidad()) return;
    if (step === 3 && !this.selectedMedico()) return;
    if (step === 4 && !this.selectedHorario()) return;
    
    this.currentStep.set(step);

    if (step === 3 && this.todosHorarios().length === 0) {
      this.cargarHorarios();
    }
  }

  nextStep() {
    if (this.currentStep() < 4) {
      this.goToStep(this.currentStep() + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.goToStep(this.currentStep() - 1);
    }
  }

  confirmarReserva() {
    const especialidad = this.selectedEspecialidad();
    const medico = this.selectedMedico();
    const horario = this.selectedHorario();
    const pacienteId = this.authService.currentUser()?.pacienteId;

    if (!especialidad || !medico || !horario || !pacienteId) {
      this.errorReserva.set('Faltan datos obligatorios para realizar la reserva.');
      return;
    }

    if (!horario.activo || horario.cuposDisponibles <= 0) {
      this.errorReserva.set('El horario seleccionado ya no está disponible.');
      return;
    }

    this.reservando.set(true);
    this.errorReserva.set(null);

    const dto = {
      pacienteId: pacienteId,
      medicoId: medico.id,
      especialidadId: especialidad.id,
      horarioMedicoId: horario.id,
      motivoConsulta: this.motivoConsulta().trim()
    };

    this.citasService.crearCita(dto).subscribe({
      next: () => {
        this.reservando.set(false);
        this.reservaExitosa.set(true);
        setTimeout(() => {
          this.router.navigate(['/mis-citas']);
        }, 2000);
      },
      error: (err) => {
        this.reservando.set(false);
        this.errorReserva.set(err.error?.mensaje || 'Error al procesar la reserva. Por favor intenta de nuevo.');
        if (err.status === 409 || err.status === 404) {
          this.cargarHorarios();
        }
      }
    });
  }
}
