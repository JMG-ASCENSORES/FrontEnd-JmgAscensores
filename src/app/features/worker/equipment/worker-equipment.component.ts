import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerEquipmentService, ClienteResumen, EquipoCliente } from './worker-equipment.service';

@Component({
  selector: 'app-worker-equipment',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './worker-equipment.component.html',
  styleUrl: './worker-equipment.component.scss'
})
export class WorkerEquipmentComponent implements OnInit {
  private service = inject(WorkerEquipmentService);

  // ── Signals ──────────────────────────────────────────────────────────────
  clientes        = signal<ClienteResumen[]>([]);
  searchQuery     = signal('');
  selectedCliente = signal<ClienteResumen | null>(null);
  equiposCliente  = signal<EquipoCliente[]>([]);
  selectedEquipo  = signal<EquipoCliente | null>(null);
  loadingClientList = signal(true);
  loadingEquipos    = signal(false);

  // ── Computed: filtrado rápido en frontend (sin llamada extra al backend) ─
  filteredClientes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.clientes();

    return this.clientes().filter(c => {
      const name    = (c.nombre_comercial || '').toLowerCase();
      const addr    = (c.ubicacion || '').toLowerCase();
      const contact = ((c.contacto_nombre || '') + ' ' + (c.contacto_apellido || '')).toLowerCase();
      const tipo    = (c.tipo_cliente || '').toLowerCase();
      return name.includes(q) || addr.includes(q) || contact.includes(q) || tipo.includes(q);
    });
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    this.service.getClientes().subscribe({
      next: data => {
        this.clientes.set(data);
        this.loadingClientList.set(false);
      },
      error: () => {
        this.loadingClientList.set(false);
      }
    });
  }

  // ── Events ────────────────────────────────────────────────────────────────
  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch() {
    this.searchQuery.set('');
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

  // ── TrackBy (rendimiento en listas) ──────────────────────────────────────
  trackByClienteId(_: number, c: ClienteResumen) { return c.cliente_id; }
  trackByEquipoId (_: number, e: EquipoCliente)  { return e.ascensor_id; }

  // ── Helpers visuales ─────────────────────────────────────────────────────
  getEstadoClass(estado: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('operat') || e.includes('activo'))     return 'estado-ok';
    if (e.includes('inoperat'))                            return 'estado-error';
    if (e.includes('reparac') || e.includes('manteni'))   return 'estado-warn';
    return 'estado-default';
  }

  getTipoIcon(tipo: string): string {
    const t = (tipo || '').toLowerCase();
    if (t.includes('montacargas')) return 'bi-box-seam';
    if (t.includes('plataforma'))  return 'bi-arrow-up-square';
    if (t.includes('escalera'))    return 'bi-chevron-bar-up';
    return 'bi-elevator'; // ascensor genérico
  }
}
