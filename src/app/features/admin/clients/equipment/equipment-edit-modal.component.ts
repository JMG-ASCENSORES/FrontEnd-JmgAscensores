import { LucideAngularModule } from 'lucide-angular';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ElevatorService } from '../../services/elevator.service';
import { Elevator } from '../../../../core/models/elevator.model';

@Component({
  selector: 'app-equipment-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './equipment-edit-modal.component.html',
})
export class EquipmentEditModalComponent implements OnInit {
  @Input() equipment!: Elevator;
  @Output() close = new EventEmitter<void>();
  @Output() equipmentUpdated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private elevatorService = inject(ElevatorService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  equipmentTypes = ['Ascensor', 'Montacarga', 'Plataforma', 'Escalera Mecánica'];
  estados = ['Operativo', 'En Mantenimiento', 'Fuera de Servicio', 'En Revisión'];

  equipmentForm!: FormGroup;

  ngOnInit() {
    this.equipmentForm = this.fb.group({
      tipo_equipo: [this.equipment.tipo_equipo || '', Validators.required],
      marca: [this.equipment.marca || '', Validators.required],
      modelo: [this.equipment.modelo || ''],
      numero_serie: [this.equipment.numero_serie || ''],
      capacidad_kg: [this.equipment.capacidad_kg !== undefined && this.equipment.capacidad_kg !== null ? this.equipment.capacidad_kg : null, [Validators.min(0)]],
      capacidad_personas: [this.equipment.capacidad_personas !== undefined && this.equipment.capacidad_personas !== null ? this.equipment.capacidad_personas : null, [Validators.min(0)]],
      piso_cantidad: [this.equipment.piso_cantidad || null, [Validators.min(1)]],
      fecha_ultimo_mantenimiento: [this.equipment.fecha_ultimo_mantenimiento ? this.equipment.fecha_ultimo_mantenimiento.split('T')[0] : ''],
      estado: [this.equipment.estado || 'Activo', Validators.required],
      observaciones: [this.equipment.observaciones || ''] // NOT required
    });
  }

  onSubmit() {
    if (this.equipmentForm.invalid) {
      this.equipmentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    // Limpiar el payload para asegurar que cadenas vacías viajen como null al backend
    const rawValue = this.equipmentForm.value;
    const payload = {
      ...rawValue,
      modelo: rawValue.modelo || null,
      numero_serie: rawValue.numero_serie || null,
      piso_cantidad: rawValue.piso_cantidad || null,
      fecha_ultimo_mantenimiento: rawValue.fecha_ultimo_mantenimiento || null,
      observaciones: rawValue.observaciones || null
    };

    this.elevatorService.updateElevator(this.equipment.ascensor_id, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.equipmentUpdated.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error updating equipment', err);
        this.isSubmitting.set(false);
        this.errorMessage.set(err.message || 'Error al actualizar el equipo.');
      }
    });
  }

  // Check if only required fields are valid
  isFormValid(): boolean {
    return this.equipmentForm?.valid || false;
  }

  onClose() {
    this.close.emit();
  }
}
