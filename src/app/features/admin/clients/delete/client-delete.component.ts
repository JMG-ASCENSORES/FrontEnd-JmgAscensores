import { LucideAngularModule } from 'lucide-angular';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';

import { ClientService, Client } from '../../services/client.service';

@Component({
  selector: 'app-client-delete',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './client-delete.component.html',
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
