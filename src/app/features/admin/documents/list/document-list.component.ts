import { LucideAngularModule } from 'lucide-angular';
import { limaTimeStr } from '../../../../shared/utils/date-lima.util';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { Report } from '../../../../core/models/report.model';
import { ClientService, Client } from '../../services/client.service';
import { TechnicianService, Technician } from '../../services/technician.service';
import { DocumentFormComponent } from '../form/document-form.component';
import { DocumentDeleteComponent } from '../delete/document-delete.component';
import { PdfPreviewComponent } from '../preview/pdf-preview.component';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentFormComponent, DocumentDeleteComponent, PdfPreviewComponent,
    LucideAngularModule
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss'
})
export class DocumentListComponent implements OnInit {
  private reportService = inject(ReportService);
  private clientService = inject(ClientService);
  private technicianService = inject(TechnicianService);
  private sanitizer = inject(DomSanitizer);

  // Filters Signals
  searchQuery = signal('');
  selectedType = signal('');
  selectedDateStart = signal('');
  selectedDateEnd = signal('');
  selectedClientId = signal<number | ''>('');
  
  // Client Search Auto-Complete Signals
  clientSearchTerm = signal('');
  showClientDropdown = signal(false);
  
  // Pagination Signals
  currentPage = signal(1);
  itemsPerPage = signal(10);
  totalPages = signal(1);
  totalDocuments = signal(0);
  maintenanceReports = signal(0);
  technicalReports = signal(0);

  isLoading = signal(true);
  error = signal<string | null>(null);

  // Data
  reports = signal<Report[]>([]);
  clients = signal<Client[]>([]);
  technicians = signal<Technician[]>([]);
  
  // Modal State
  showFormModal = signal(false);
  formMode = signal<'create' | 'edit'>('create');
  showDeleteModal = signal(false);
  
  // PDF Preview State
  showPdfModal = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  pdfDownloadUrl = signal<string | null>(null);
  pdfFileName = signal('');
  generatingPdfId = signal<number | null>(null);

  selectedReport = signal<Report | null>(null);

  // Client Filtering Logic
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
          this.selectedClientId.set('');
          this.clientSearchTerm.set('');
      }
      this.showClientDropdown.set(false);
      
      // Trigger API fetch
      this.applyFilters();
  }

  ngOnInit(): void {
    // Load metadata first, then initial page of reports
    this.loadMetadata();
  }

  loadMetadata() {
    this.clientService.getClients().subscribe({
      next: (clients) => this.clients.set(clients),
      error: (err) => console.error('Error loading clients', err)
    });

    this.technicianService.getTechnicians().subscribe({
      next: (techs) => this.technicians.set(techs),
      error: (err) => console.error('Error loading technicians', err)
    });

    this.fetchReports();
  }

  fetchReports() {
    this.isLoading.set(true);
    
    const filters: any = {
      page: this.currentPage(),
      limit: this.itemsPerPage()
    };

    if (this.selectedType()) filters.tipo_informe = this.selectedType();
    if (this.selectedClientId()) filters.cliente_id = this.selectedClientId();
    if (this.selectedDateStart()) filters.fecha_inicio = this.selectedDateStart();
    if (this.selectedDateEnd()) filters.fecha_fin = this.selectedDateEnd();
    if (this.searchQuery()) filters.search = this.searchQuery();

    this.reportService.getReports(filters).subscribe({
      next: (response) => {
        this.reports.set(response.informes);
        this.totalDocuments.set(response.meta.total || 0);
        this.maintenanceReports.set(response.meta.totalMaintenance || 0);
        this.technicalReports.set(response.meta.totalTechnical || 0);
        this.totalPages.set(response.meta.totalPages || 1);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading reports', err);
        this.error.set('Error al cargar documentos.');
        this.isLoading.set(false);
      }
    });
  }

  // Se llama cuando se cambian filtros explícitos como inputs
  applyFilters() {
      this.currentPage.set(1);
      this.fetchReports();
  }

  // Paginación UI Controls
  nextPage() {
      if (this.currentPage() < this.totalPages()) {
          this.currentPage.set(this.currentPage() + 1);
          this.fetchReports();
      }
  }

  prevPage() {
      if (this.currentPage() > 1) {
          this.currentPage.set(this.currentPage() - 1);
          this.fetchReports();
      }
  }

  // Helpers
  getClientName(id: number): string {
    const client = this.clients().find(c => c.cliente_id === id);
    if (!client) return 'Desconocido';
    return client.nombre_comercial || `${client.contacto_nombre || ''} ${client.contacto_apellido || ''}`.trim() || 'Cliente';
  }

  getWorkerName(id: number): string {
     const tech = this.technicians().find(t => t.id === id);
     return tech ? `${tech.nombre} ${tech.apellido}` : `Técnico ${id}`;
  }

  // Actions
  openCreateModal() {
    this.selectedReport.set(null);
    this.formMode.set('create');
    this.showFormModal.set(true);
  }
  openEditModal(report: Report) {
    this.selectedReport.set(report);
    this.formMode.set('edit');
    this.showFormModal.set(true);
  }
  closeFormModal() {
    this.showFormModal.set(false);
    this.selectedReport.set(null);
  }
  onReportSaved() { this.fetchReports(); }

  openDeleteModal(report: Report) {
    this.selectedReport.set(report);
    this.showDeleteModal.set(true);
  }
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedReport.set(null);
  }
  onReportDeleted() {
    // Si borró el último de la página y hay anteriores, volver atrás
    if (this.reports().length === 1 && this.currentPage() > 1) {
       this.currentPage.set(this.currentPage() - 1);
    }
    this.fetchReports();
  }

  downloadReport(report: Report) {
    this.generatingPdfId.set(report.informe_id); 
    this.reportService.downloadReportPdf(report.informe_id).subscribe({
      next: (blob) => {
          // Aseguramos que el blob sea tratado como el nombre correcto si el navegador lo soporta
          const url = URL.createObjectURL(blob);
          this.pdfDownloadUrl.set(url);
          this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
          
          this.pdfFileName.set(`${this.getReportDisplayName(report)}.pdf`);
          
          this.showPdfModal.set(true);
          this.generatingPdfId.set(null);
      },
      error: (err) => {
        console.error('Error downloading PDF', err);
        this.error.set('No se pudo generar el PDF. Verifica que el servidor esté activo.');
        this.generatingPdfId.set(null);
      }
    });
  }

  downloadPdfDirectly(report: Report, event?: Event) {
    if (event) event.stopPropagation();
    this.generatingPdfId.set(report.informe_id);
    this.reportService.downloadReportPdf(report.informe_id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.getReportDisplayName(report)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        this.generatingPdfId.set(null);
      },
      error: (err) => {
        console.error('Error downloading PDF', err);
        this.generatingPdfId.set(null);
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
      // Parseo manual para evitar conversión UTC→local que resta 1 día en Perú (UTC-5)
      const parts = String(dateString).split('T')[0].split('-');
      if (parts.length < 3) return dateString;
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Usar toLocaleString para obtener la hora local de Perú (UTC-5)
    // El backend envía ISO (Z), por lo que el navegador lo convierte correctamente.
    const d = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const t = limaTimeStr(date);
    return `${d} ${t}`;
  }

  getReportDisplayName(report: Report): string {
    const typePrefix = report.tipo_informe === 'Mantenimiento' ? 'MAN' : 'TEC';
    const reportNum = report.informe_id.toString().padStart(6, '0');
    const clientName = this.getClientName(report.cliente_id);
    return `${typePrefix} - ${reportNum} - ${clientName}`;
  }
}
