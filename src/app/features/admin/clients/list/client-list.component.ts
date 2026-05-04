import { LucideAngularModule } from 'lucide-angular';
import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService, Client } from '../../services/client.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { ClientCreateComponent } from '../create/client-create.component';
import { ClientEditComponent } from '../edit/client-edit.component';
import { ClientDeleteComponent } from '../delete/client-delete.component';
import { ClientRestoreComponent } from '../restore/client-restore.component';
import { EquipmentListModalComponent } from '../equipment/equipment-list-modal.component';
import { EntityCardComponent } from '../../../../shared/components/entity-card/entity-card.component';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ClientCreateComponent, ClientEditComponent, ClientDeleteComponent, ClientRestoreComponent, EquipmentListModalComponent, EntityCardComponent,
    LucideAngularModule
  ],
  templateUrl: './client-list.component.html',
})
export class ClientListComponent implements OnInit, OnDestroy {
  private clientService = inject(ClientService);
  private destroy$ = new Subject<void>();

  // Data Signals
  clients = signal<Client[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(12);
  totalItems = signal(0);
  totalPages = signal(0);

  // Global Stats (loaded once, independent of pagination)
  totalClients = signal(0);
  totalAscensores = signal(0);
  totalMontacargas = signal(0);
  totalPlataformas = signal(0);

  // Filters
  searchQuery = signal('');
  searchSubject = new Subject<string>();
  selectedDistrict = signal('');
  selectedType = signal<string>('all');
  
  // Modal State
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showRestoreModal = signal(false);

  selectedClient = signal<Client | null>(null);

  // Equipment Modal State
  showEquipmentModal = signal(false);
  selectedEquipmentType = signal<string>('');

  districts = computed(() => {
    const allClients = this.clients();
    if (!allClients || allClients.length === 0) return [];
    const unique = [...new Set(allClients.map(c => c.distrito).filter((d): d is string => Boolean(d)))];
    return unique.sort();
  });

  ngOnInit() {
    this.loadStats();
    this.loadData();

    // Debounced search logic
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
    
    // We use the paginated endpoint. Note: distrito filter is still frontend-only for now 
    // unless the backend is updated. But searching is now server-side.
    this.clientService.getClientsPaginated(
      this.currentPage(),
      this.pageSize(),
      this.searchQuery()
    ).subscribe({
      next: (response) => {
        this.clients.set(response.data || []);
        if (response.meta) {
          this.totalItems.set(response.meta.totalItems);
          this.totalPages.set(response.meta.totalPages);
        } else {
          this.totalItems.set(response.data.length);
          this.totalPages.set(1);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set(err.message || 'Error al cargar los datos.');
        this.isLoading.set(false);
      }
    });
  }

  /** Load global stats once — single lightweight SQL query */
  loadStats() {
    this.clientService.getClientStats().subscribe({
      next: (response) => {
        this.totalClients.set(response.data.total_clientes);
        this.totalAscensores.set(response.data.total_ascensores);
        this.totalMontacargas.set(response.data.total_montacargas);
        this.totalPlataformas.set(response.data.total_plataformas);
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  // Handle Search input
  onSearch(term: string) {
    this.searchSubject.next(term);
  }

  // Filter change handler
  onFilterChange() {
    this.currentPage.set(1);
    this.loadData();
  }

  // Computed Properties for UI (Remaining client-side filters like District/Type)
  filteredClients = computed(() => {
    const district = this.selectedDistrict();
    const typeFilter = this.selectedType();
    
    return this.clients().filter(client => {
      // Hide inactive clients from the main list
      if (client.estado_activo === false) return false;

      // Filter by type (if not already filtered by server)
      if (typeFilter !== 'all' && client.tipo_cliente !== typeFilter) return false;
      
      const matchDistrict = district ? client.distrito?.toLowerCase() === district.toLowerCase() : true;
      
      return matchDistrict;
    });
  });

  // Global stats are loaded via loadStats() — no per-page computation needed

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

  // Accessors for Template logic
  getInitials(name: string | undefined | null): string {
    return (name || '?').substring(0, 2).toUpperCase();
  }

  // Modal Actions
  openCreateModal() { this.showCreateModal.set(true); }
  closeCreateModal() { this.showCreateModal.set(false); }
  onClientCreated() { this.loadStats(); this.loadData(); }

  openEditModal(client: Client) {
    this.selectedClient.set(client);
    this.showEditModal.set(true);
  }
  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedClient.set(null);
  }
  onClientUpdated() { this.loadStats(); this.loadData(); }

  openDeleteModal(client: Client) {
    this.selectedClient.set(client);
    this.showDeleteModal.set(true);
  }
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedClient.set(null);
  }
  onClientDeleted() { this.loadStats(); this.loadData(); }

  openRestoreModal() { this.showRestoreModal.set(true); }
  closeRestoreModal() { this.showRestoreModal.set(false); }
  onClientRestored() { this.loadStats(); this.loadData(); }

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
    this.loadStats();
    this.loadData();
  }
}
