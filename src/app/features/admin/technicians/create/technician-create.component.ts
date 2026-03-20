import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TechnicianService } from '../../services/technician.service';

@Component({
  selector: 'app-technician-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './technician-create.component.html',
  styleUrl: './technician-create.component.scss'
})
export class TechnicianCreateComponent {
  @Output() close = new EventEmitter<void>();
  @Output() technicianCreated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private technicianService = inject(TechnicianService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  technicianForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]], // Strict 8 digits
    edad: ['', [Validators.required, Validators.min(18), Validators.max(80)]],
    correo: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    telefono: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    especialidad: ['Técnico General', Validators.required]
  });

  specialties = [
    'Técnico General',
    'Técnico de Mantenimiento',
    'Supervisor Técnico',
    'Técnico de Reparaciones'
  ];

  onSubmit(): void {
    if (this.technicianForm.invalid) {
      this.technicianForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    // Prepare data - ensure numbers are numbers and map to backend schema
    const formValue = this.technicianForm.value;
    const payload = {
      nombre: formValue.nombre,
      apellido: formValue.apellido,
      dni: formValue.dni,
      edad: Number(formValue.edad),
      correo: formValue.correo,
      telefono: formValue.telefono,
      especialidad: formValue.especialidad,
      contrasena: formValue.password // Map password to contrasena
      // rol and estado_activo are handled by backend defaults or not needed
    };

    this.technicianService.createTechnician(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.technicianCreated.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error creating technician', err);
        this.isSubmitting.set(false);
        this.errorMessage.set('Error al registrar el técnico. Verifique los datos o intente nuevamente.');
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
