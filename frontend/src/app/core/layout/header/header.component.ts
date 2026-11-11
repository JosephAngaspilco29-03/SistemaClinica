import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Input() pageTitle = 'Dashboard';
  @Output() toggleMenu = new EventEmitter<void>();

  private authService = inject(AuthService);
  private router = inject(Router);

  get user() { return this.authService.currentUser(); }
  get userName() { return this.user?.nombreUsuario || 'Usuario'; }
  get userRole() { return this.user?.rol || ''; }
  get userInitials() { return this.userName.substring(0, 2).toUpperCase(); }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
