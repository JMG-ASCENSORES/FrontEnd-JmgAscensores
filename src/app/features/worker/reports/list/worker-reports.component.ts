import { LucideAngularModule } from 'lucide-angular';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../admin/services/report.service';
import { ClientService, Client } from '../../../admin/services/client.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Report } from '../../../../core/models/report.model';
import { WorkerReportCreateComponent } from '../create/worker-report-create.component';
import { PdfPreviewComponent } from '../../../admin/documents/preview/pdf-preview.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-worker-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, WorkerReportCreateComponent, PdfPreviewComponent, LoadingSpinnerComponent,
    LucideAngularModule
  ],
  templateUrl: './worker-reports.component.html',
  styleUrl: './worker-reports.component.scss'
})
export class WorkerReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private clientService = inject(ClientService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  reports = signal<Report[]>([]);
  clients = signal<Client[]>([]);
  isLoading = signal(true);
  showCreate = signal(false);

  // PDF Preview State
  showPdfModal = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  pdfDownloadUrl = signal<string | null>(null);
  pdfFileName = signal('');
  generatingPdfId = signal<number | null>(null);

  // Filters
  filterTipo = signal('');
  filterCliente = signal('');
  filterFechaInicio = signal('');
  filterFechaFin = signal('');
  showFilters = signal(false);

  // Client Autocomplete in Filter
  clientSearch = signal('');
  showClientDropdown = signal(false);
  filteredClients = signal<Client[]>([]);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(10);
  totalPages = signal(1);

  ngOnInit() {
    this.loadClients();
    this.loadReports();
  }

  loadClients() {
    this.clientService.getClients().subscribe({
      next: (data) => this.clients.set(data),
      error: (err) => console.error('Error loading clients', err)
    });
  }

  loadReports() {
    const user = this.authService.currentUser();
    if (!user || user.tipo !== 'trabajador') {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    
    // Config filters
    const filters: any = { 
       trabajador_id: user.id,
       page: this.currentPage(),
       limit: this.itemsPerPage()
    };
    if (this.filterTipo()) filters.tipo_informe = this.filterTipo();
    if (this.filterCliente()) filters.cliente_id = this.filterCliente();
    if (this.filterFechaInicio()) filters.fecha_inicio = this.filterFechaInicio();
    if (this.filterFechaFin()) filters.fecha_fin = this.filterFechaFin();

    this.reportService.getReports(filters).subscribe({
      next: (response) => {
        this.reports.set(response.informes);
        this.totalPages.set(response.meta.totalPages || 1);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching reports', err);
        this.isLoading.set(false);
      }
    });
  }

  nextPage() {
      if (this.currentPage() < this.totalPages()) {
          this.currentPage.set(this.currentPage() + 1);
          this.loadReports();
      }
  }

  prevPage() {
      if (this.currentPage() > 1) {
          this.currentPage.set(this.currentPage() - 1);
          this.loadReports();
      }
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadReports();
    this.showFilters.set(false);
  }

  // Filter Autocomplete Logic
  onClientSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.clientSearch.set(query);
    this.showClientDropdown.set(true);

    if (query.length < 2) {
      this.filteredClients.set([]);
      this.filterCliente.set(''); // Clear ID if search is too short
      return;
    }

    const filtered = this.clients().filter(c => 
      (c.nombre_comercial?.toLowerCase().includes(query) || 
       c.contacto_nombre?.toLowerCase().includes(query))
    );
    this.filteredClients.set(filtered);
  }

  selectClient(client: Client) {
    this.filterCliente.set(client.cliente_id.toString());
    this.clientSearch.set(client.nombre_comercial || client.contacto_nombre || '');
    this.showClientDropdown.set(false);
  }

  closeDropdowns() {
    setTimeout(() => {
      this.showClientDropdown.set(false);
      // If no valid client selected and search is not empty, we might want to reset or keep it.
      // For now, we just close the dropdown.
    }, 200);
  }

  clearFilters() {
    this.filterTipo.set('');
    this.filterCliente.set('');
    this.clientSearch.set('');
    this.filterFechaInicio.set('');
    this.filterFechaFin.set('');
    this.currentPage.set(1);
    this.loadReports();
  }

  onReportCreated() {
    this.currentPage.set(1);
    this.loadReports();
  }

  viewPdf(report: Report) {
    this.generatingPdfId.set(report.informe_id);
    this.reportService.downloadReportPdf(report.informe_id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.pdfDownloadUrl.set(url);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.pdfFileName.set(`${this.getReportDisplayName(report)}.pdf`);
        this.showPdfModal.set(true);
        this.generatingPdfId.set(null);
      },
      error: (err) => {
        console.error('Error downloading PDF', err);
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

  getReportDisplayName(report: Report): string {
    const typePrefix = report.tipo_informe === 'Mantenimiento' ? 'MAN' : 'TEC';
    const reportNum = report.informe_id.toString().padStart(6, '0');
    const client = report.Cliente || this.clients().find(c => c.cliente_id === report.cliente_id);
    const clientName = client ? (client.nombre_comercial || client.contacto_nombre || 'Cliente') : 'Cliente';
    return `${typePrefix} - ${reportNum} - ${clientName}`;
  }
}
