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
  imports: [CommonModule, FormsModule, ClientCreateComponent, ClientEditComponent, ClientDeleteComponent, ClientRestoreComponent, EquipmentListModalComponent, EntityCardComponent],
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

  // Mock Data for filters
  districts = ['San Isidro', 'Miraflores', 'Surco', 'Lima'];

  ngOnInit() {
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
      
      // Filter by district (Frontend filter for now)
      const matchDistrict = district ? (client.ubicacion || '').toLowerCase().includes(district.toLowerCase()) : true;
      
      return matchDistrict;
    });
  });

  // Global Stats (Note: These reflect the current data. For full totals, 
  // we might need a separate total-stats endpoint if counts are per-page).
  totalClients = computed(() => this.totalItems());
  
  totalAscensores = computed(() => 
    this.clients().reduce((acc, curr) => acc + (curr.ascensores_count || 0), 0)
  );
  
  totalMontacargas = computed(() => 
    this.clients().reduce((acc, curr) => acc + (curr.montacargas_count || 0), 0)
  );
  
  totalPlataformas = computed(() => 
    this.clients().reduce((acc, curr) => acc + (curr.plataforma_count || 0), 0)
  );

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
  onClientCreated() { this.loadData(); }

  openEditModal(client: Client) {
    this.selectedClient.set(client);
    this.showEditModal.set(true);
  }
  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedClient.set(null);
  }
  onClientUpdated() { this.loadData(); }

  openDeleteModal(client: Client) {
    this.selectedClient.set(client);
    this.showDeleteModal.set(true);
  }
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedClient.set(null);
  }
  onClientDeleted() { this.loadData(); }

  openRestoreModal() { this.showRestoreModal.set(true); }
  closeRestoreModal() { this.showRestoreModal.set(false); }
  onClientRestored() { this.loadData(); }

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
    this.loadData();
  }
}
