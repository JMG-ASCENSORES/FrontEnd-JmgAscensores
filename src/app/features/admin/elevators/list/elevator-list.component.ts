import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ElevatorService } from '../../services/elevator.service';
import { ClientService, Client } from '../../services/client.service';
import { Elevator } from '../../../../core/models/elevator.model';

import { ElevatorCreateComponent } from '../create/elevator-create.component';
import { ElevatorEditComponent } from '../edit/elevator-edit.component';
import { ElevatorDeleteComponent } from '../delete/elevator-delete.component';
import { EntityCardComponent } from '../../../../shared/components/entity-card/entity-card.component';

import { FilterContainerComponent } from '../../../../shared/components/filters/filter-container/filter-container.component';
import { FilterInputComponent } from '../../../../shared/components/filters/filter-input/filter-input.component';
import { FilterSelectComponent } from '../../../../shared/components/filters/filter-select/filter-select.component';

export interface ClientGroup {
  cliente_id: number;
  cliente_nombre: string;
  elevators: Elevator[];
}

@Component({
  selector: 'app-elevator-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ElevatorCreateComponent, 
    ElevatorEditComponent, 
    ElevatorDeleteComponent, 
    EntityCardComponent,
    FilterContainerComponent,
    FilterInputComponent,
    FilterSelectComponent
  ],
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

    this.elevatorService.getElevators().subscribe({
      next: (elevators) => {
        const uniqueClientsMap = new Map<number, any>();
        
        const enrichedElevators = elevators.map(elevator => {
          const c = (elevator as any).Cliente;
          const name = c ? (c.nombre_comercial || (c.contacto_nombre ? `${c.contacto_nombre} ${c.contacto_apellido || ''}` : 'Sin nombre')) : 'Cliente Desconocido';
          
          if (c && !uniqueClientsMap.has(c.cliente_id)) {
            uniqueClientsMap.set(c.cliente_id, c);
          }

          return {
            ...elevator,
            cliente_nombre: name
          };
        });

        this.elevators.set(enrichedElevators);
        this.clients.set(Array.from(uniqueClientsMap.values()));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set(err.message || 'Error al cargar los ascensores.');
        this.isLoading.set(false);
      }
    });
  }

  // Reload elevators and their mapped clients
  reloadElevators() {
    this.loadData();
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

  groupedElevators = computed<ClientGroup[]>(() => {
    const filtered = this.filteredElevators();
    const groups = new Map<number, ClientGroup>();
    
    for (const elevator of filtered) {
       const cid = elevator.cliente_id;
       if (!groups.has(cid)) {
           groups.set(cid, {
               cliente_id: cid,
               cliente_nombre: elevator.cliente_nombre || 'Cliente Desconocido',
               elevators: []
           });
       }
       groups.get(cid)!.elevators.push(elevator);
    }
    
    // Sort clients alphabetically
    return Array.from(groups.values()).sort((a,b) => a.cliente_nombre.localeCompare(b.cliente_nombre));
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
      case 'Operativo': return 'text-emerald-500';
      case 'En Mantenimiento': return 'text-amber-500';
      case 'Fuera de Servicio': return 'text-red-600';
      case 'En Revisión': return 'text-blue-500';
      default: return 'text-slate-400';
    }
  }
}
