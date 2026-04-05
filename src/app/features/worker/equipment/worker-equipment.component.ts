import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { WorkerEquipmentService, ClienteResumen, EquipoCliente } from './worker-equipment.service';

import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-worker-equipment',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, LoadingSpinnerComponent, SkeletonLoaderComponent],
  templateUrl: './worker-equipment.component.html',
  styleUrl: './worker-equipment.component.scss'
})
export class WorkerEquipmentComponent implements OnInit, OnDestroy {
  private service = inject(WorkerEquipmentService);
  private destroy$ = new Subject<void>();

  // Data Signals
  clientes          = signal<ClienteResumen[]>([]);
  searchQuery       = signal('');
  selectedCliente   = signal<ClienteResumen | null>(null);
  equiposCliente    = signal<EquipoCliente[]>([]);
  selectedEquipo    = signal<EquipoCliente | null>(null);
  loadingClientList = signal(true);
  loadingEquipos    = signal(false);

  // Pagination Signals
  currentPage = signal(1);
  pageSize    = signal(15);
  totalItems  = signal(0);
  totalPages  = signal(0);

  // Search Subject (debounce)
  private searchSubject = new Subject<string>();

  // Lifecycle
  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchQuery.set(term);
      this.currentPage.set(1);
      this.loadClientes();
    });

    this.loadClientes();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Data Loading
  loadClientes() {
    this.loadingClientList.set(true);

    this.service.getClientesPaginated(
      this.currentPage(),
      this.pageSize(),
      this.searchQuery() || undefined
    ).subscribe({
      next: response => {
        this.clientes.set(response.data || []);
        if (response.meta) {
          this.totalItems.set(response.meta.totalItems);
          this.totalPages.set(response.meta.totalPages);
        } else {
          const len = (response.data || []).length;
          this.totalItems.set(len);
          this.totalPages.set(1);
        }
        this.loadingClientList.set(false);
      },
      error: () => {
        this.loadingClientList.set(false);
      }
    });
  }

  // Events
  onSearch(event: Event) {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadClientes();
  }

  // Pagination Actions
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadClientes();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadClientes();
    }
  }

  selectCliente(cliente: ClienteResumen) {
    this.selectedCliente.set(cliente);
    this.selectedEquipo.set(null);
    this.loadingEquipos.set(true);

    this.service.getEquiposByCliente(cliente.cliente_id).subscribe({
      next: data => {
        this.equiposCliente.set(data);
        this.loadingEquipos.set(false);
      },
      error: () => {
        this.equiposCliente.set([]);
        this.loadingEquipos.set(false);
      }
    });
  }

  closeClientModal() {
    this.selectedCliente.set(null);
    this.equiposCliente.set([]);
    this.selectedEquipo.set(null);
  }

  selectEquipo(equipo: EquipoCliente) {
    this.selectedEquipo.set(equipo);
  }

  closeEquipoModal() {
    this.selectedEquipo.set(null);
  }

  // TrackBy
  trackByClienteId(_: number, c: ClienteResumen) { return c.cliente_id; }
  trackByEquipoId (_: number, e: EquipoCliente)  { return e.ascensor_id; }

  // Visual helpers
  getEstadoClass(estado: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('operat') || e.includes('activo'))   return 'estado-ok';
    if (e.includes('inoperat'))                          return 'estado-error';
    if (e.includes('reparac') || e.includes('manteni')) return 'estado-warn';
    return 'estado-default';
  }

  getTipoIcon(tipo: string): string {
    const t = (tipo || '').toLowerCase();
    if (t.includes('montacargas')) return 'bi-box-seam';
    if (t.includes('plataforma'))  return 'bi-arrow-up-square';
    if (t.includes('escalera'))    return 'bi-chevron-bar-up';
    return 'bi-elevator';
  }
}
