import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { Report } from '../../../../core/models/report.model';
import { ClientService, Client } from '../../services/client.service';
import { TechnicianService, Technician } from '../../services/technician.service';
import { DocumentCreateComponent } from '../create/document-create.component';
import { DocumentEditComponent } from '../edit/document-edit.component';
import { DocumentDeleteComponent } from '../delete/document-delete.component';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentCreateComponent, DocumentEditComponent, DocumentDeleteComponent],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss'
})
export class DocumentListComponent implements OnInit {
  private reportService = inject(ReportService);
  private clientService = inject(ClientService);
  private technicianService = inject(TechnicianService);

  // Signals
  searchQuery = signal('');
  selectedType = signal('');
  selectedDate = signal('');
  selectedClientId = signal<number | ''>('');
  
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Data
  reports = signal<Report[]>([]);
  clients = signal<Client[]>([]);
  technicians = signal<Technician[]>([]);
  
  // Modal State
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  selectedReport = signal<Report | null>(null);

  // Stats
  totalDocuments = computed(() => this.reports().length);
  maintenanceReports = computed(() => this.reports().filter(r => r.tipo_informe === 'Mantenimiento' || r.tipo_informe === 'mantenimiento').length);
  technicalReports = computed(() => this.reports().filter(r => r.tipo_informe === 'Técnico' || r.tipo_informe === 'tecnico').length);

  // Filtered Data
  filteredReports = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const type = this.selectedType();
    const date = this.selectedDate(); // Simple match for now
    const clientId = this.selectedClientId();

    return this.reports().filter(report => {
      // Search matches ID or maybe Client Name if we had it joined or mapped
      // For now match ID or type or description
      const matchesSearch = 
        report.informe_id.toString().includes(query) ||
        report.tipo_informe.toLowerCase().includes(query) ||
        report.descripcion_trabajo?.toLowerCase().includes(query);

      const matchesType = type ? report.tipo_informe === type : true;
      
      // Date filter: validation logic depends on date format. Simplified check.
      const matchesDate = date ? report.fecha_informe.startsWith(date) : true;
      
      const matchesClient = clientId ? report.cliente_id === Number(clientId) : true;

      return matchesSearch && matchesType && matchesDate && matchesClient;
    });
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    // ForkJoin or sequential
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients.set(clients);
      },
      error: (err) => console.error('Error loading clients', err)
    });

    this.technicianService.getTechnicians().subscribe({
      next: (techs) => this.technicians.set(techs),
      error: (err) => console.error('Error loading technicians', err)
    });

    this.reportService.getReports().subscribe({
      next: (data) => {
        this.reports.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading reports', err);
        this.error.set('Error al cargar documentos.');
        this.isLoading.set(false);
      }
    });
  }

  // Helpers to get names from IDs
  getClientName(id: number): string {
    const client = this.clients().find(c => c.cliente_id === id);
    return client ? (client.nombre_comercial || client.contacto_nombre || 'Cliente') : 'Desconocido';
  }

  getWorkerName(id: number): string {
     const tech = this.technicians().find(t => t.id === id);
     return tech ? `${tech.nombre} ${tech.apellido}` : `Técnico ${id}`;
  }

  // Actions
  openCreateModal() {
    this.showCreateModal.set(true);
  }
  
  closeCreateModal() {
    this.showCreateModal.set(false);
  }
  
  onReportCreated() {
    this.loadData();
    // Could add a toast here
  }

  openEditModal(report: Report) {
    this.selectedReport.set(report);
    this.showEditModal.set(true);
  }
  
  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedReport.set(null);
  }
  
  onReportUpdated() {
    this.loadData();
  }

  openDeleteModal(report: Report) {
    this.selectedReport.set(report);
    this.showDeleteModal.set(true);
  }
  
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedReport.set(null);
  }
  
  onReportDeleted() {
    this.loadData();
  }

  downloadReport(report: Report) {
    console.log('Download', report);
  }

  formatDate(dateString: string): string {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('es-ES');
  }
}
