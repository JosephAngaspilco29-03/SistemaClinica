import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
  disabled?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private authService = inject(AuthService);

  private allNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: ['Administrador', 'Medico', 'Enfermero', 'Paciente'] },
    
    // Administrador
    { label: 'Pacientes', icon: 'people', route: '/pacientes', roles: ['Administrador'] },
    { label: 'Médicos', icon: 'medical_services', route: '/medicos', roles: ['Administrador'] },
    { label: 'Especialidades', icon: 'category', route: '/especialidades', roles: ['Administrador'] },
    { label: 'Horarios', icon: 'schedule', route: '/horarios', roles: ['Administrador'] },
    { label: 'Usuarios', icon: 'manage_accounts', route: '/usuarios', roles: ['Administrador'] },
    { label: 'Reportes', icon: 'bar_chart', route: '/reportes', roles: ['Administrador'] },

    // Medico
    { label: 'Mi agenda', icon: 'calendar_today', route: '/agenda', roles: ['Medico'] },
    { label: 'Mi disponibilidad', icon: 'schedule', route: '/mi-disponibilidad', roles: ['Medico'] },
    { label: 'Atenciones', icon: 'assignment_turned_in', route: '/atenciones', roles: ['Medico'] },
    { label: 'Historial Clínico', icon: 'history_edu', route: '/historial-medico', roles: ['Medico'] },

    // Enfermero
    { label: 'Citas', icon: 'calendar_month', route: '/citas-enfermero', roles: ['Enfermero'] },
    { label: 'Triaje', icon: 'monitor_heart', route: '/triaje', roles: ['Enfermero'] },

    // Paciente
    { label: 'Mis citas', icon: 'event', route: '/mis-citas', roles: ['Paciente'] },
    { label: 'Reservar cita', icon: 'edit_calendar', route: '/reservar-cita', roles: ['Paciente'] },
    { label: 'Mi historial', icon: 'history', route: '/mi-historial', roles: ['Paciente'] }
  ];

  navItems = computed(() => {
    const role = this.authService.currentUser()?.rol;
    if (!role) return [];
    return this.allNavItems.filter(item => item.roles.includes(role));
  });
}
