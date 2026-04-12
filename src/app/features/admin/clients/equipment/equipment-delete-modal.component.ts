import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';

import { ElevatorService } from '../../services/elevator.service';
import { Elevator } from '../../../../core/models/elevator.model';

@Component({
  selector: 'app-equipment-delete-modal',
  standalone: true,
  imports: [],
  templateUrl: './equipment-delete-modal.component.html',
})
export class EquipmentDeleteModalComponent {
  @Input() equipment!: Elevator;
  @Output() close = new EventEmitter<void>();
  @Output() equipmentDeleted = new EventEmitter<void>();

  private elevatorService = inject(ElevatorService);

  isDeleting = signal(false);
  errorMessage = signal<string | null>(null);

  onDelete() {
    this.isDeleting.set(true);
    this.errorMessage.set(null);

    this.elevatorService.deleteElevator(this.equipment.ascensor_id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.equipmentDeleted.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error deleting equipment', err);
        this.isDeleting.set(false);
        this.errorMessage.set(err.message || 'Error al eliminar el equipo.');
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
