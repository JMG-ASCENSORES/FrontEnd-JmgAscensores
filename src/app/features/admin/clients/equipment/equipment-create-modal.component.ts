import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ElevatorService } from '../../services/elevator.service';
import { Client } from '../../services/client.service';

@Component({
  selector: 'app-equipment-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  equipmentTypes = ['Ascensor', 'Montacarga', 'Plataforma'];
  estados = ['Activo', 'Inactivo', 'En Mantenimiento'];

  equipmentForm: FormGroup = this.fb.group({
    tipo_equipo: [this.equipmentType || 'Ascensor', Validators.required],
    marca: ['', Validators.required],
    modelo: [''],
    numero_serie: [''],
    capacidad: [''],
    piso_cantidad: [null],
    fecha_ultimo_mantenimiento: [''],
    estado: ['Activo', Validators.required],
    observaciones: ['']
  });

  onSubmit() {
    if (this.equipmentForm.invalid) {
      this.equipmentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      cliente_id: this.client.cliente_id,
      ...this.equipmentForm.value
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
