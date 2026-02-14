import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { ElevatorService } from '../../services/elevator.service';
import { ClientService, Client } from '../../services/client.service';
import { Elevator } from '../../../../core/models/elevator.model';

import { ElevatorCreateComponent } from '../create/elevator-create.component';
import { ElevatorEditComponent } from '../edit/elevator-edit.component';
import { ElevatorDeleteComponent } from '../delete/elevator-delete.component';

@Component({
  selector: 'app-elevator-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ElevatorCreateComponent, ElevatorEditComponent, ElevatorDeleteComponent],
  templateUrl: './elevator-list.component.html',
  styleUrl: './elevator-list.component.scss'
})
export class ElevatorListComponent implements OnInit {
  private elevatorService = inject(ElevatorService);
  private clientService = inject(ClientService);

  // Data Signals
  elevators = signal<Elevator[]>([]);
  clients = signal<Client[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  clientSearchTerm = signal(''); 
  selectedClientId = signal<number | null>(null);
  showClientDropdown = signal(false);
  
  selectedType = signal<string>('');
  selectedStatus = signal<string>('');

  // Modal State
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);

  selectedElevator = signal<Elevator | null>(null);

  // Filter Options
  equipmentTypes = ['Ascensor', 'Montacarga', 'Plataforma', 'Escalera Mecánica'];
  statuses = ['Operativo', 'En Mantenimiento', 'Fuera de Servicio', 'En Revisión'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      elevators: this.elevatorService.getElevators(),
      clients: this.clientService.getClients()
    }).subscribe({
      next: ({ elevators, clients }) => {
        // Enriched elevators with client names
        const enrichedElevators = elevators.map(elevator => {
          const client = clients.find(c => c.cliente_id === elevator.cliente_id);
          return {
            ...elevator,
            cliente_nombre: client?.nombre_comercial || (client?.contacto_nombre ? `${client.contacto_nombre} ${client.contacto_apellido || ''}` : 'Cliente Desconocido')
          };
        });

        this.elevators.set(enrichedElevators);
        this.clients.set(clients);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set(err.message || 'Error al cargar los datos.');
        this.isLoading.set(false);
      }
    });
  }

  // Reload just elevators but keep clients
  reloadElevators() {
    this.isLoading.set(true);
    this.elevatorService.getElevators().subscribe({
      next: (elevators) => {
        const clients = this.clients();
        const enrichedElevators = elevators.map(elevator => {
            const client = clients.find(c => c.cliente_id === elevator.cliente_id);
            return {
              ...elevator,
              cliente_nombre: client?.nombre_comercial || (client?.contacto_nombre ? `${client.contacto_nombre} ${client.contacto_apellido || ''}` : 'Cliente Desconocido')
            };
          });
        this.elevators.set(enrichedElevators);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al actualizar la lista.');
        this.isLoading.set(false);
      }
    });
  }

  // Client Filter Logic (Dropdown)
  filteredClients = computed(() => {
     const term = this.clientSearchTerm().toLowerCase();
     if (term.length < 2) return []; 
     return this.clients().filter(c => 
        (c.nombre_comercial?.toLowerCase().includes(term) || 
         c.contacto_nombre?.toLowerCase().includes(term) ||
         c.contacto_apellido?.toLowerCase().includes(term))
     );
  });

  onClientSearch() {
     if (this.clientSearchTerm().length >= 2) {
         this.showClientDropdown.set(true);
     }
  }

  selectClient(client: Client | null) {
      if (client) {
          this.selectedClientId.set(client.cliente_id);
          const fullName = client.nombre_comercial || `${client.contacto_nombre || ''} ${client.contacto_apellido || ''}`.trim();
          this.clientSearchTerm.set(fullName);
      } else {
          this.selectedClientId.set(null);
          this.clientSearchTerm.set('');
      }
      this.showClientDropdown.set(false);
  }

  // Computed Properties for UI
  filteredElevators = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const type = this.selectedType();
    const status = this.selectedStatus();
    const clientId = this.selectedClientId();

    return this.elevators().filter(elevator => {
      const matchQuery = 
        (elevator.numero_serie || '').toLowerCase().includes(query) ||
        (elevator.marca || '').toLowerCase().includes(query) ||
        (elevator.modelo || '').toLowerCase().includes(query);

      // Client Filter: Strict ID match if selected
      const matchClient = clientId ? elevator.cliente_id === clientId : true;
      
      const matchType = type ? elevator.tipo_equipo === type : true;
      const matchStatus = status ? elevator.estado === status : true;

      return matchQuery && matchClient && matchType && matchStatus;
    });
  });

  // Stats
  totalElevators = computed(() => this.elevators().length);
  operationalCount = computed(() => this.elevators().filter(e => e.estado === 'Operativo').length);
  maintenanceCount = computed(() => this.elevators().filter(e => e.estado === 'En Mantenimiento').length);
  outOfServiceCount = computed(() => this.elevators().filter(e => e.estado === 'Fuera de Servicio').length);

  // Modal Actions
  openCreateModal() { this.showCreateModal.set(true); }
  closeCreateModal() { this.showCreateModal.set(false); }
  onElevatorCreated() { this.reloadElevators(); }

  openEditModal(elevator: Elevator) {
    this.selectedElevator.set(elevator);
    this.showEditModal.set(true);
  }
  closeEditModal() { 
    this.showEditModal.set(false); 
    this.selectedElevator.set(null);
  }
  onElevatorUpdated() { this.reloadElevators(); }

  openDeleteModal(elevator: Elevator) {
    this.selectedElevator.set(elevator);
    this.showDeleteModal.set(true);
  }
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedElevator.set(null);
  }
  onElevatorDeleted() { this.reloadElevators(); }

  // Helpers
  getStatusColor(status?: string): string {
    switch (status) {
      case 'Operativo': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'En Mantenimiento': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Fuera de Servicio': return 'text-red-600 bg-red-50 border-red-200';
      case 'En Revisión': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }
}
