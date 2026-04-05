import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ConfiguracionService, SystemSetting } from '../services/configuracion.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private configService = inject(ConfiguracionService);

  // States
  isLoading = signal(true);
  isSaving = signal(false);
  saveSuccess = signal(false);
  errorMessage = signal<string | null>(null);
  activeTab = signal<'profile' | 'security' | 'system'>('profile');
  
  // Data
  profile = signal<any>(null);
  systemSettings = signal<SystemSetting[]>([]);
  
  // Forms
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  // UI Helpers
  showNuevaPass = signal(false);
  showConfirmaPass = signal(false);

  get initials(): string {
    const p = this.profile();
    if (!p) return '';
    return `${p.nombre?.charAt(0) || ''}${p.apellido?.charAt(0) || ''}`.toUpperCase();
  }

  ngOnInit() {
    this.initForms();
    this.loadData();
  }

  private initForms() {
    this.profileForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern(/^[0-9]{9}$/)]]
    });

    this.passwordForm = this.fb.group({
      nueva_contrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmar_contrasena: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('nueva_contrasena')?.value === g.get('confirmar_contrasena')?.value
      ? null : { passwordMismatch: true };
  }

  loadData() {
    this.isLoading.set(true);
    this.configService.getProfile().subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.profileForm.patchValue({
          nombre: res.data.nombre,
          apellido: res.data.apellido,
          dni: res.data.dni,
          correo: res.data.correo,
          telefono: res.data.telefono
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al cargar el perfil');
        this.isLoading.set(false);
      }
    });

    this.configService.getSystemSettings().subscribe({
      next: (res) => {
        this.systemSettings.set(res.data);
      }
    });
  }

  onSaveProfile() {
    if (this.profileForm.invalid) return;
    
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.saveSuccess.set(false);

    this.configService.updateProfile(this.profileForm.value)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          this.profile.set(res.data);
          this.saveSuccess.set(true);
          // Update auth service state if needed
          setTimeout(() => this.saveSuccess.set(false), 3000);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al actualizar el perfil');
        }
      });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    
    this.configService.updateProfile({ contrasena: this.passwordForm.value.nueva_contrasena })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.saveSuccess.set(true);
          this.passwordForm.reset();
          setTimeout(() => this.saveSuccess.set(false), 3000);
        },
        error: (err) => this.errorMessage.set('Error al cambiar la contraseña')
      });
  }

  updateSystemSetting(clave: string, event: any) {
    const valor = event.target.value;
    this.configService.updateSystemSetting(clave, valor).subscribe({
      next: () => {
        // Success feedback
      },
      error: () => this.errorMessage.set('Error al actualizar configuración del sistema')
    });
  }
}
