import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ElevatorService } from '../../services/elevator.service';
import { Elevator } from '../../../../core/models/elevator.model';

@Component({
  selector: 'app-equipment-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  equipmentTypes = ['Ascensor', 'Montacarga', 'Plataforma'];
  estados = ['Activo', 'Inactivo', 'En Mantenimiento'];

  equipmentForm!: FormGroup;

  ngOnInit() {
    this.equipmentForm = this.fb.group({
      tipo_equipo: [this.equipment.tipo_equipo || '', Validators.required],
      marca: [this.equipment.marca || '', Validators.required],
      modelo: [this.equipment.modelo || ''],
      numero_serie: [this.equipment.numero_serie || ''],
      capacidad: [this.equipment.capacidad || ''],
      piso_cantidad: [this.equipment.piso_cantidad || null],
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

    this.elevatorService.updateElevator(this.equipment.ascensor_id, this.equipmentForm.value).subscribe({
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
    const tipoEquipo = this.equipmentForm.get('tipo_equipo');
    const marca = this.equipmentForm.get('marca');
    const estado = this.equipmentForm.get('estado');
    
    return !!(tipoEquipo?.valid && marca?.valid && estado?.valid);
  }

  onClose() {
    this.close.emit();
  }
}
