import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Location, CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private location = inject(Location);

  readonly authMode = signal<'login' | 'register'>('login');
  readonly isRevealed = signal(false);

  // LOGIN STATE
  loginForm = this.fb.nonNullable.group({
    nombreUsuario: ['', Validators.required],
    password: ['', Validators.required]
  });

  loading = false;
  error = '';
  showPassword = false;
  submitted = false;

  // REGISTER STATE
  registerStep = signal<1 | 2>(1);
  registerLoading = false;
  registerError = '';
  registerSubmitted = false;
  registerSuccess = false;

  registerForm = this.fb.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    documentoIdentidad: ['', Validators.required],
    fechaNacimiento: ['', Validators.required],
    sexo: ['', Validators.required],
    telefono: [''],
    email: ['', [Validators.email]],
    direccion: [''],
    nombreUsuario: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    if (password && confirm && password !== confirm) {
      return { mismatch: true };
    }
    return null;
  }

  ngOnInit() {
    const currentUrl = this.router.url || this.location.path();
    this.syncModeFromUrl(currentUrl);

    this.location.onUrlChange((url) => {
      this.syncModeFromUrl(url);
    });

    if (isPlatformBrowser(this.platformId)) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.isRevealed.set(true);
        });
      });
    } else {
      this.isRevealed.set(true);
    }
  }

  private syncModeFromUrl(url: string) {
    if (url.includes('registro')) {
      if (this.authMode() !== 'register') {
        this.authMode.set('register');
        this.registerStep.set(1);
      }
    } else {
      if (this.authMode() !== 'login') {
        this.authMode.set('login');
      }
    }
  }

  switchMode(mode: 'login' | 'register') {
    this.authMode.set(mode);
    if (mode === 'login') {
      this.location.go('/login');
      this.submitted = false;
      this.error = '';
    } else {
      this.location.go('/registro');
      this.registerStep.set(1);
      this.registerSubmitted = false;
      this.registerError = '';
      this.registerSuccess = false;
    }
  }

  nextStep() {
    const step1Controls = ['nombres', 'apellidos', 'documentoIdentidad', 'fechaNacimiento', 'sexo'];
    let valid = true;
    step1Controls.forEach(c => {
      const control = this.registerForm.get(c);
      if (control?.invalid) {
        control.markAsTouched();
        valid = false;
      }
    });
    if (valid) {
      this.registerStep.set(2);
    }
  }

  prevStep() {
    this.registerStep.set(1);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.mensaje || 'Error al iniciar sesión. Verifica tus credenciales.';
      }
    });
  }

  onRegisterSubmit() {
    this.registerSubmitted = true;
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.registerLoading = true;
    this.registerError = '';
    this.registerSuccess = false;

    const formValues = this.registerForm.getRawValue();
    const data = {
      nombreUsuario: formValues.nombreUsuario,
      password: formValues.password,
      nombres: formValues.nombres,
      apellidos: formValues.apellidos,
      documentoIdentidad: formValues.documentoIdentidad,
      fechaNacimiento: formValues.fechaNacimiento,
      sexo: formValues.sexo,
      telefono: formValues.telefono,
      email: formValues.email,
      direccion: formValues.direccion
    };

    this.authService.register(data).subscribe({
      next: (res) => {
        this.registerLoading = false;
        this.registerSuccess = true;
        
        setTimeout(() => {
          this.loginForm.patchValue({ nombreUsuario: data.nombreUsuario ?? '' });
          this.switchMode('login');
          this.registerSuccess = false;
          this.registerForm.reset();
        }, 1800);
      },
      error: (err) => {
        this.registerLoading = false;
        this.registerError = err.error?.mensaje || 'Error al crear la cuenta.';
      }
    });
  }
}
