import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { TechnicianService, Technician } from '../../services/technician.service';

@Component({
  selector: 'app-technician-delete',
  standalone: true,
  imports: [ConfirmModalComponent],
  template: `
    <app-confirm-modal
      title="¿Eliminar Técnico?"
      [message]="'¿Estás seguro que deseas eliminar a <strong>' + technician.nombre + ' ' + technician.apellido + '</strong>? Esta acción desactivará su cuenta y no podrá ingresar al sistema.'"
      confirmText="Eliminar"
      cancelText="Cancelar"
      icon="alert-triangle"
      confirmVariant="danger"
      [isLoading]="isDeleting()"
      [errorMessage]="errorMessage() || ''"
      (close)="onCancel()"
      (confirm)="onDelete()"
    />
  `,
})
export class TechnicianDeleteComponent {
  @Input() technician!: Technician;
  @Output() close = new EventEmitter<void>();
  @Output() technicianDeleted = new EventEmitter<void>();

  private technicianService = inject(TechnicianService);

  isDeleting = signal(false);
  errorMessage = signal<string | null>(null);

  onDelete(): void {
    if (!this.technician) return;

    this.isDeleting.set(true);
    this.errorMessage.set(null);

    this.technicianService.deleteTechnician(this.technician.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.technicianDeleted.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error deleting technician', err);
        this.isDeleting.set(false);
        this.errorMessage.set('Error al eliminar el técnico. Intente nuevamente.');
      }
    });
  }

  onCancel(): void {
    this.close.emit();
  }
}