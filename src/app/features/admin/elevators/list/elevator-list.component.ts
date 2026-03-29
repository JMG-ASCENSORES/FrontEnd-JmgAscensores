import { Component, OnInit, computed, inject, signal, OnDestroy } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
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
export class ElevatorListComponent implements OnInit, OnDestroy {
  private elevatorService = inject(ElevatorService);
  private clientService = inject(ClientService);
  private destroy$ = new Subject<void>();

  // Data Signals
  elevators = signal<Elevator[]>([]);
  clients = signal<Client[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  searchQuery = signal('');
  searchSubject = new Subject<string>();
  
  clientSearchTerm = signal(''); 
  selectedClientId = signal<number | null>(null);
  showClientDropdown = signal(false);
  
  selectedType = signal<string>('');
  selectedStatus = signal<string>('');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(12);
  totalItems = signal(0);
  totalPages = signal(0);

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
    
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchQuery.set(term);
      this.onFilterChange();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.isLoading.set(true);
    this.error.set(null);

    this.elevatorService.getElevatorsPaginated(
      this.currentPage(),
      this.pageSize(),
      this.searchQuery(),
      this.selectedClientId(),
      this.selectedType(),
      this.selectedStatus()
    ).subscribe({
      next: (response) => {
        const elevatorsList = Array.isArray(response.data) ? response.data : 
                             (response.data ? [response.data as Elevator] : []);
        
        const uniqueClientsMap = new Map<number, any>();
        
        const enrichedElevators = elevatorsList.map(elevator => {
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
        
        if (response.meta) {
          this.totalItems.set(response.meta.totalItems);
          this.totalPages.set(response.meta.totalPages);
        } else {
          this.totalItems.set(elevatorsList.length);
          this.totalPages.set(1);
        }

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
      this.onFilterChange();
  }

  onSearch(term: string) {
    this.searchSubject.next(term);
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadData();
  }

  // Recordar que filteredElevators ya no es necesario,
  // la API devuelve los resultados exactos que necesitamos.
  groupedElevators = computed<ClientGroup[]>(() => {
    const list = this.elevators();
    const groups = new Map<number, ClientGroup>();
    
    for (const elevator of list) {
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
  totalElevators = computed(() => this.totalItems());
  // Las demás stats reflejarán solo la vista actual por limitación de diseño paginado base
  operationalCount = computed(() => this.elevators().filter(e => e.estado === 'Operativo').length);
  maintenanceCount = computed(() => this.elevators().filter(e => e.estado === 'En Mantenimiento').length);
  outOfServiceCount = computed(() => this.elevators().filter(e => e.estado === 'Fuera de Servicio').length);

  // Pagination Actions
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadData();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadData();
    }
  }

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
