import { LucideAngularModule } from 'lucide-angular';
import { Component, EventEmitter, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientService, Client } from '../../services/client.service';

@Component({
  selector: 'app-client-restore',
  standalone: true,
  imports: [CommonModule,
    LucideAngularModule
  ],
  templateUrl: './client-restore.component.html'
})
export class ClientRestoreComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() clientRestored = new EventEmitter<void>();

  private clientService = inject(ClientService);

  // State
  inactiveClients = signal<Client[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Confirmation State
  confirmingId = signal<number | null>(null);
  isProcessing = signal(false);

  ngOnInit(): void {
    this.loadInactiveClients();
  }

  loadInactiveClients(): void {
    this.isLoading.set(true);
    // Fetch specifically inactive clients
    this.clientService.getClients({ estado_activo: false }).subscribe({
      next: (inactive) => {
        this.inactiveClients.set(inactive);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading inactive clients', err);
        this.error.set('No se pudieron cargar los clientes inactivos.');
        this.isLoading.set(false);
      }
    });
  }

  initiateRestore(id: number): void {
    this.confirmingId.set(id);
  }

  cancelRestore(): void {
    this.confirmingId.set(null);
  }

  confirmRestore(client: Client): void {
    this.isProcessing.set(true);
    
    // API call to reactivate
    this.clientService.updateClient(client.cliente_id, { estado_activo: true }).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.confirmingId.set(null);
        this.loadInactiveClients(); // refresh local list
        this.clientRestored.emit(); // notify parent
      },
      error: (err) => {
        console.error('Error restoring client', err);
        this.isProcessing.set(false);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
