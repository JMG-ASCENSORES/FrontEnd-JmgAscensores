import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { Report } from '../../../../core/models/report.model';
import { ClientService, Client } from '../../services/client.service';
import { TechnicianService, Technician } from '../../services/technician.service';
import { DocumentCreateComponent } from '../create/document-create.component';
import { DocumentEditComponent } from '../edit/document-edit.component';
import { DocumentDeleteComponent } from '../delete/document-delete.component';
import { PdfPreviewComponent } from '../preview/pdf-preview.component';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentCreateComponent, DocumentEditComponent, DocumentDeleteComponent, PdfPreviewComponent],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss'
})
export class DocumentListComponent implements OnInit {
  private reportService = inject(ReportService);
  private clientService = inject(ClientService);
  private technicianService = inject(TechnicianService);
  private sanitizer = inject(DomSanitizer);

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
  
  // PDF Preview State
  showPdfModal = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  pdfDownloadUrl = signal<string | null>(null);
  pdfFileName = signal('');

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
    this.isLoading.set(true); 
    this.reportService.downloadReportPdf(report.informe_id).subscribe({
      next: (blob) => {
         const url = URL.createObjectURL(blob);
         this.pdfDownloadUrl.set(url);
         this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
         
         // Generate filename: ID_TIPO_CLIENTE.pdf
         const cleanString = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '');
         
         const clientName = cleanString(this.getClientName(report.cliente_id));
         const tipo = cleanString(report.tipo_informe);
         
         this.pdfFileName.set(`${report.informe_id}_${tipo}_${clientName}.pdf`);
         
         this.showPdfModal.set(true);
         this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error downloading PDF', err);
        this.error.set('No se pudo generar el PDF. Verifica que el servidor esté activo.');
        this.isLoading.set(false);
      }
    });
  }

  closePdfModal() {
     this.showPdfModal.set(false);
     const url = this.pdfDownloadUrl();
     if (url) {
         URL.revokeObjectURL(url);
         this.pdfDownloadUrl.set(null);
         this.pdfUrl.set(null);
     }
  }

  formatDate(dateString: string): string {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('es-ES');
  }
}
