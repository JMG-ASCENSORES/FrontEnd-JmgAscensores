import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { ElevatorService } from '../../services/elevator.service';
import { Elevator } from '../../../../core/models/elevator.model';

@Component({
  selector: 'app-elevator-delete',
  standalone: true,
  imports: [ConfirmModalComponent],
  template: `
    <app-confirm-modal
      title="¿Eliminar Equipo?"
      [message]="'Estás a punto de eliminar el equipo <strong>' + elevator.numero_serie + '</strong> (' + (elevator.modelo || 'Sin modelo') + '). Esta acción es irreversible y eliminará todo el historial de mantenimientos asociado.'"
      confirmText="Sí, Eliminar"
      cancelText="Cancelar"
      icon="alert-triangle"
      confirmVariant="danger"
      [isLoading]="isSubmitting()"
      [errorMessage]="error() || ''"
      (close)="close.emit()"
      (confirm)="confirmDelete()"
    />
  `,
})
export class ElevatorDeleteComponent {
  @Input() elevator!: Elevator;
  @Output() close = new EventEmitter<void>();
  @Output() elevatorDeleted = new EventEmitter<void>();

  private elevatorService = inject(ElevatorService);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  confirmDelete() {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.error.set(null);

    this.elevatorService.deleteElevator(this.elevator.ascensor_id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.elevatorDeleted.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(err.message || 'Error al eliminar el equipo.');
      }
    });
  }
}