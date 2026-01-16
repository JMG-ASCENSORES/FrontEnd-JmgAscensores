import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService, Client } from '../../services/client.service';
import { forkJoin } from 'rxjs';

import { ClientCreateComponent } from '../create/client-create.component';
import { ClientEditComponent } from '../edit/client-edit.component';
import { ClientDeleteComponent } from '../delete/client-delete.component';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ClientCreateComponent, ClientEditComponent, ClientDeleteComponent],
  templateUrl: './client-list.component.html',
})
export class ClientListComponent implements OnInit {
  private clientService = inject(ClientService);

  // Data Signals
  clients = signal<Client[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  selectedDistrict = signal('');
  
  // Modal State
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);

  selectedClient = signal<Client | null>(null);

  // Mock Data for filters
  districts = ['San Isidro', 'Miraflores', 'Surco', 'Lima'];

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.isLoading.set(true);
    this.error.set(null);
    
    forkJoin({
      clients: this.clientService.getClients(),
      elevators: this.clientService.getElevators()
    }).subscribe({
      next: ({ clients, elevators }) => {
        // Map elevators to clients to get the count
        const enhancedData = clients.map(client => {
          // Flexible matching for "ascensor" type content
          const clientElevators = elevators.filter(e => 
            e.cliente_id === client.cliente_id && 
            e.tipo_equipo?.toLowerCase().includes('ascensor')
          );
          
          return {
            ...client,
            ascensores_count: clientElevators.length
          };
        });

        this.clients.set(enhancedData);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set(err.message || 'Error al cargar los datos.');
        this.isLoading.set(false);
      }
    });
  }

  // Computed Properties for UI
  filteredClients = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const district = this.selectedDistrict();
    
    return this.clients().filter(client => {
      const matchQuery = (client.nombre_comercial || client.contacto_nombre || '').toLowerCase().includes(query) ||
                         (client.ruc || '').includes(query) ||
                         (client.dni || '').includes(query);
      
      const matchDistrict = district ? (client.ubicacion || '').includes(district) : true;
      
      return matchQuery && matchDistrict;
    });
  });

  totalClients = computed(() => this.clients().length);
  totalEquipments = computed(() => this.clients().reduce((acc, curr) => acc + (curr.ascensores_count || 0), 0));

  // Accessors for Template logic
  getInitials(name: string | undefined | null): string {
    return (name || '?').substring(0, 2).toUpperCase();
  }

  // Modal Actions
  openCreateModal() {
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  onClientCreated() {
    this.loadClients();
  }

  openEditModal(client: Client) {
    this.selectedClient.set(client);
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedClient.set(null);
  }

  onClientUpdated() {
    this.loadClients();
  }

  openDeleteModal(client: Client) {
    this.selectedClient.set(client);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedClient.set(null);
  }

  onClientDeleted() {
    this.loadClients();
  }
}
