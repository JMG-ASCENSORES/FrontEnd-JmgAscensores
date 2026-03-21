import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { WorkerService, WorkerProfile } from '../services/worker.service';
import { AuthService } from '../../../core/services/auth.service';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import SignaturePad from 'signature_pad';

/** Validador: nuevaContraseña y confirmarContraseña deben coincidir */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('nueva_contrasena')?.value;
  const confirma = control.get('confirmar_contrasena')?.value;
  if (nueva && confirma && nueva !== confirma) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-worker-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './worker-profile.component.html',
  styleUrl: './worker-profile.component.scss'
})
export class WorkerProfileComponent implements OnInit {
  private workerService = inject(WorkerService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  profile = signal<WorkerProfile | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  saveSuccess = signal(false);
  errorMessage = signal<string | null>(null);

  // Password section
  showPasswordSection = signal(false);
  showNuevaPass = signal(false);
  showConfirmaPass = signal(false);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // Signature Section
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
  signaturePad!: SignaturePad;
  showSignaturePad = signal(false);
  hasSavedSignature = signal(false);

  ngOnInit() {
    this.initForms();
    this.loadProfile();
  }

  ngAfterViewInit() {
    // Note: SignaturePad will be initialized when showSignaturePad is true
  }

  initSignaturePad() {
    setTimeout(() => {
      if (this.signatureCanvas) {
        this.signaturePad = new SignaturePad(this.signatureCanvas.nativeElement, {
          minWidth: 1,
          maxWidth: 3,
          penColor: '#1e293b'
        });
        
        // Handle resize
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));
      }
    }, 100);
  }

  resizeCanvas() {
    if (this.signatureCanvas && this.signaturePad) {
      const canvas = this.signatureCanvas.nativeElement;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
      this.signaturePad.clear();
    }
  }

  clearSignature() {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  toggleSignaturePad() {
    this.showSignaturePad.update(v => !v);
    if (this.showSignaturePad()) {
      this.initSignaturePad();
    } else {
      window.removeEventListener('resize', this.resizeCanvas.bind(this));
    }
  }

  saveSignature() {
    if (this.signaturePad && !this.signaturePad.isEmpty()) {
      const dataUrl = this.signaturePad.toDataURL('image/png');
      this.isSaving.set(true);
      
      this.workerService.updateMyProfile({ firma_defecto_base64: dataUrl }).subscribe({
         next: (updated) => {
            this.profile.set(updated);
            this.isSaving.set(false);
            this.saveSuccess.set(true);
            this.toggleSignaturePad();
            setTimeout(() => this.saveSuccess.set(false), 3000);
         },
         error: (err) => {
            console.error('Error guardando firma', err);
            this.isSaving.set(false);
            this.errorMessage.set('Error guardando firma. Intente nuevamente.');
         }
      });
    }
  }

  initForms() {
    this.profileForm = this.fb.group({
      nombre:   ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)]], 
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)]],
      correo:   ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern(/^\d{9}$/)]],
    });

    this.passwordForm = this.fb.group({
      nueva_contrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmar_contrasena: ['', Validators.required],
    }, { validators: passwordMatchValidator });
  }

  loadProfile() {
    this.isLoading.set(true);
    this.workerService.getMyProfile().subscribe({
      next: (data: WorkerProfile) => {
        this.profile.set(data);
        this.profileForm.patchValue({
          nombre: data.nombre,
          apellido: data.apellido,
          correo: data.correo,
          telefono: data.telefono || '',
        });
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando perfil:', err);
        this.errorMessage.set('No se pudo cargar el perfil. Intenta nuevamente.');
        this.isLoading.set(false);
      }
    });
  }

  onSaveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.saveSuccess.set(false);

    this.workerService.updateMyProfile(this.profileForm.value).subscribe({
      next: (updated: WorkerProfile) => {
        this.profile.set(updated);
        this.isSaving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err: any) => {
        console.error('Error actualizando perfil:', err);
        this.isSaving.set(false);
        this.errorMessage.set('Error al guardar los cambios. Intenta nuevamente.');
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const nueva = this.passwordForm.get('nueva_contrasena')?.value;
    this.isSaving.set(true);
    this.errorMessage.set(null);

    this.workerService.updateMyProfile({ contrasena_hash: nueva }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.passwordForm.reset();
        this.showPasswordSection.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err: any) => {
        console.error('Error cambiando contraseña:', err);
        this.isSaving.set(false);
        this.errorMessage.set('No se pudo cambiar la contraseña.');
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  get initials(): string {
    const p = this.profile();
    if (!p) return '?';
    return `${p.nombre?.[0] ?? ''}${p.apellido?.[0] ?? ''}`.toUpperCase();
  }
}
