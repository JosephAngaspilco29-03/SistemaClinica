import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/public/home/home.component';
import { roleGuard } from './core/guards/role.guard';
import { MisCitasComponent } from './features/citas/mis-citas/mis-citas.component';
import { ReservarCitaComponent } from './features/citas/reservar-cita/reservar-cita.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, data: { title: 'Dashboard' } },
      { 
        path: 'mis-citas', 
        component: MisCitasComponent,
        canActivate: [roleGuard],
        data: { roles: ['Paciente'], title: 'Mis citas' }
      },
      {
        path: 'reservar-cita',
        component: ReservarCitaComponent,
        canActivate: [roleGuard],
        data: { roles: ['Paciente'], title: 'Reservar cita' }
      },
      {
        path: 'mi-historial',
        loadComponent: () => import('./features/historial/mi-historial/mi-historial.component').then(m => m.MiHistorialComponent),
        canActivate: [roleGuard],
        data: { roles: ['Paciente'], title: 'Mi historial' }
      },
      {
        path: 'mi-disponibilidad',
        loadComponent: () => import('./features/medico/mi-disponibilidad/mi-disponibilidad.component').then(m => m.MiDisponibilidadComponent),
        canActivate: [roleGuard],
        data: { roles: ['Medico'], title: 'Mi disponibilidad' }
      },
      {
        path: 'agenda',
        loadComponent: () => import('./features/medico/agenda/agenda.component').then(m => m.AgendaComponent),
        canActivate: [roleGuard],
        data: { roles: ['Medico'], title: 'Mi agenda' }
      },
      {
        path: 'citas-enfermero',
        loadComponent: () => import('./features/enfermero/citas/citas-enfermero.component').then(m => m.CitasEnfermeroComponent),
        canActivate: [roleGuard],
        data: { roles: ['Enfermero'], title: 'Citas de enfermería' }
      },
      {
        path: 'triaje',
        loadComponent: () => import('./features/enfermero/triaje/triaje.component').then(m => m.TriajeComponent),
        canActivate: [roleGuard],
        data: { roles: ['Enfermero'], title: 'Triaje' }
      },
      {
        path: 'atenciones',
        loadComponent: () => import('./features/medico/atenciones/atenciones.component').then(m => m.AtencionesComponent),
        canActivate: [roleGuard],
        data: { roles: ['Medico'], title: 'Atenciones' }
      },
      {
        path: 'historial-medico',
        loadComponent: () => import('./features/medico/historial-medico/historial-medico.component').then(m => m.HistorialMedicoComponent),
        canActivate: [roleGuard],
        data: { roles: ['Medico'], title: 'Historial clínico' }
      },
      {
        path: 'pacientes',
        loadComponent: () => import('./features/admin/pacientes/lista-pacientes.component').then(m => m.ListaPacientesComponent),
        canActivate: [roleGuard],
        data: { roles: ['Administrador'], title: 'Gestión de pacientes' }
      },
      {
        path: 'medicos',
        loadComponent: () => import('./features/admin/medicos/lista-medicos.component').then(m => m.ListaMedicosComponent),
        canActivate: [roleGuard],
        data: { roles: ['Administrador'], title: 'Gestión de médicos' }
      },
      {
        path: 'especialidades',
        loadComponent: () => import('./features/admin/especialidades/lista-especialidades.component').then(m => m.ListaEspecialidadesComponent),
        canActivate: [roleGuard],
        data: { roles: ['Administrador'], title: 'Gestión de especialidades' }
      },
      {
        path: 'horarios',
        loadComponent: () => import('./features/admin/horarios/lista-horarios.component').then(m => m.ListaHorariosComponent),
        canActivate: [roleGuard],
        data: { roles: ['Administrador'], title: 'Gestión de horarios' }
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/admin/usuarios/lista-usuarios.component').then(m => m.ListaUsuariosComponent),
        canActivate: [roleGuard],
        data: { roles: ['Administrador'], title: 'Gestión de usuarios' }
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/admin/reportes/reportes.component').then(m => m.ReportesComponent),
        canActivate: [roleGuard],
        data: { roles: ['Administrador'], title: 'Reportes' }
      },
      // Other routes will be added here later
    ]
  },
  { path: '**', redirectTo: '' }
];
