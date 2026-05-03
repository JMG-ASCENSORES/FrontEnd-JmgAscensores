import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { ClientService, Client } from '../../services/client.service';

@Component({
  selector: 'app-client-delete',
  standalone: true,
  imports: [ConfirmModalComponent],
  template: `
    <app-confirm-modal
      title="¿Eliminar Cliente?"
      [message]="'¿Estás seguro que desea eliminar a <strong>' + (client.nombre_comercial || client.contacto_nombre) + '</strong>? Esta acción no se puede deshacer.'"
      confirmText="Eliminar"
      cancelText="Cancelar"
      icon="trash-2"
      confirmVariant="danger"
      [isLoading]="isDeleting()"
      [errorMessage]="errorMessage() || ''"
      (close)="onClose()"
      (confirm)="onDelete()"
    />
  `,
})
export class ClientDeleteComponent {
  @Input() client!: Client;
  @Output() close = new EventEmitter<void>();
  @Output() clientDeleted = new EventEmitter<void>();

  private clientService = inject(ClientService);

  isDeleting = signal(false);
  errorMessage = signal<string | null>(null);

  onDelete(): void {
    if (!this.client || !this.client.cliente_id) return;

    this.isDeleting.set(true);
    this.errorMessage.set(null);

    this.clientService.deleteClient(this.client.cliente_id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.clientDeleted.emit();
        this.close.emit();
      },
      error: (err: any) => {
        console.error('Error deleting client', err);
        this.isDeleting.set(false);
        this.errorMessage.set('Error al eliminar. Inténtelo de nuevo.');
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}