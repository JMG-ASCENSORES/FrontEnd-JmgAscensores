import { LucideAngularModule } from 'lucide-angular';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ElevatorService } from '../../services/elevator.service';
import { Client } from '../../services/client.service';

@Component({
  selector: 'app-equipment-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './equipment-create-modal.component.html',
})
export class EquipmentCreateModalComponent {
  @Input() client!: Client;
  @Input() equipmentType!: string;
  @Output() close = new EventEmitter<void>();
  @Output() equipmentCreated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private elevatorService = inject(ElevatorService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  equipmentTypes = ['Ascensor', 'Montacarga', 'Plataforma', 'Escalera Mecánica'];
  estados = ['Operativo', 'En Mantenimiento', 'Fuera de Servicio', 'En Revisión'];

  equipmentForm: FormGroup = this.fb.group({
    tipo_equipo: [this.equipmentType || 'Ascensor', Validators.required],
    marca: ['', Validators.required],
    modelo: [''],
    numero_serie: [''],
    capacidad_kg: [null, [Validators.min(0)]],
    capacidad_personas: [null, [Validators.min(0)]],
    piso_cantidad: [null, [Validators.min(1)]],
    fecha_ultimo_mantenimiento: [''],
    estado: ['Operativo', Validators.required],
    observaciones: [''] // Optional - can be empty
  });

  onSubmit() {
    // Mark all fields as touched to show validation errors
    this.equipmentForm.markAllAsTouched();
    
    // Only check required fields
    if (this.equipmentForm.invalid) {
      return; // Don't submit if form is invalid (including min values)
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    // Prepare payload, convert empty strings to null for optional fields
    const formValue = this.equipmentForm.value;
    const payload = {
      cliente_id: this.client.cliente_id,
      tipo_equipo: formValue.tipo_equipo,
      marca: formValue.marca,
      modelo: formValue.modelo || null,
      numero_serie: formValue.numero_serie || null,
      capacidad_kg: formValue.capacidad_kg || null,
      capacidad_personas: formValue.capacidad_personas || null,
      piso_cantidad: formValue.piso_cantidad || null,
      fecha_ultimo_mantenimiento: formValue.fecha_ultimo_mantenimiento || null,
      estado: formValue.estado,
      observaciones: formValue.observaciones || null // Convert empty string to null
    };

    this.elevatorService.createElevator(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.equipmentCreated.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error creating equipment', err);
        this.isSubmitting.set(false);
        this.errorMessage.set(err.message || 'Error al crear el equipo.');
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
