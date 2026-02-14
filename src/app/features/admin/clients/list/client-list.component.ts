import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService, Client } from '../../services/client.service';
import { forkJoin } from 'rxjs';

import { ClientCreateComponent } from '../create/client-create.component';
import { ClientEditComponent } from '../edit/client-edit.component';
import { ClientDeleteComponent } from '../delete/client-delete.component';
import { EquipmentListModalComponent } from '../equipment/equipment-list-modal.component';
import { EntityCardComponent } from '../../../../shared/components/entity-card/entity-card.component';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ClientCreateComponent, ClientEditComponent, ClientDeleteComponent, EquipmentListModalComponent, EntityCardComponent],
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

  // Equipment Modal State
  showEquipmentModal = signal(false);
  selectedEquipmentType = signal<string>('');

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
        // Map elevators to clients and count each equipment type
        const enhancedData = clients.map(client => {
          const clientEquipment = elevators.filter(e => e.cliente_id === client.cliente_id);
          
          // Count each type separately
          const ascensores = clientEquipment.filter(e => 
            e.tipo_equipo?.toLowerCase().includes('ascensor')
          ).length;
          
          const montacargas = clientEquipment.filter(e => 
            e.tipo_equipo?.toLowerCase().includes('montacarga')
          ).length;
          
          const plataformas = clientEquipment.filter(e => 
            e.tipo_equipo?.toLowerCase().includes('plataforma')
          ).length;
          
          return {
            ...client,
            ascensores_count: ascensores,
            montacargas_count: montacargas,
            plataforma_count: plataformas
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
  
  totalAscensores = computed(() => 
    this.clients().reduce((acc, curr) => acc + (curr.ascensores_count || 0), 0)
  );
  
  totalMontacargas = computed(() => 
    this.clients().reduce((acc, curr) => acc + (curr.montacargas_count || 0), 0)
  );
  
  totalPlataformas = computed(() => 
    this.clients().reduce((acc, curr) => acc + (curr.plataforma_count || 0), 0)
  );

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

  // Equipment Modal Actions
  openEquipmentModal(client: Client, equipmentType: string) {
    this.selectedClient.set(client);
    this.selectedEquipmentType.set(equipmentType);
    this.showEquipmentModal.set(true);
  }

  closeEquipmentModal() {
    this.showEquipmentModal.set(false);
    this.selectedClient.set(null);
    this.selectedEquipmentType.set('');
  }

  onEquipmentChanged() {
    this.loadClients(); // Reload to update counts
  }
}
