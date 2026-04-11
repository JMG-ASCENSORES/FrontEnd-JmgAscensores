import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TechnicianService, Technician } from '../../services/technician.service';
import { ModalWrapperComponent } from '../../../../shared/components/modal-wrapper/modal-wrapper.component';

@Component({
  selector: 'app-technician-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalWrapperComponent],
  templateUrl: './technician-edit.component.html',
  styleUrl: './technician-edit.component.scss'
})
export class TechnicianEditComponent implements OnInit {
  @Input() technician!: Technician;
  @Output() close = new EventEmitter<void>();
  @Output() technicianUpdated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private technicianService = inject(TechnicianService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  technicianForm!: FormGroup;

  specialties = [
    'Técnico General',
    'Técnico de Mantenimiento',
    'Supervisor Técnico',
    'Técnico de Reparaciones'
  ];

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    if (!this.technician) return;

    this.technicianForm = this.fb.group({
      nombre: [this.technician.nombre, [Validators.required, Validators.minLength(2)]],
      apellido: [this.technician.apellido, [Validators.required, Validators.minLength(2)]],
      dni: [this.technician.dni, [Validators.required, Validators.pattern(/^\d{8}$/)]], 
      edad: [this.technician.edad, [Validators.required, Validators.min(18), Validators.max(80)]],
      correo: [this.technician.correo, [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      telefono: [this.technician.telefono, [Validators.required, Validators.pattern(/^9\d{8}$/)]],
      password: [''], // Optional for edit, minLength 6 if provided
      especialidad: [this.technician.especialidad, Validators.required],
      estado_activo: [this.technician.estado_activo]
    });

    // Add validator for password only if it has value
    this.technicianForm.get('password')?.valueChanges.subscribe(value => {
      const passwordControl = this.technicianForm.get('password');
      if (value) {
        passwordControl?.setValidators([Validators.minLength(6)]);
      } else {
        passwordControl?.clearValidators();
      }
      passwordControl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  onSubmit(): void {
    if (this.technicianForm.invalid) {
      this.technicianForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.technicianForm.value;
    
    // Construct payload
    const payload: any = {
      nombre: formValue.nombre,
      apellido: formValue.apellido,
      dni: formValue.dni,
      edad: Number(formValue.edad),
      correo: formValue.correo,
      telefono: formValue.telefono,
      especialidad: formValue.especialidad,
      estado_activo: formValue.estado_activo
    };

    // Only add password if user typed one
    if (formValue.password) {
      payload.contrasena = formValue.password;
    }

    this.technicianService.updateTechnician(this.technician.id, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.technicianUpdated.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error updating technician', err);
        this.isSubmitting.set(false);
        this.errorMessage.set('Error al actualizar el técnico. Intente nuevamente.');
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
