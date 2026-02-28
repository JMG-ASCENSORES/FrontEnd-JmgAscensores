import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../admin/services/report.service';
import { ClientService, Client } from '../../../admin/services/client.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Report } from '../../../../core/models/report.model';
import { WorkerReportCreateComponent } from '../create/worker-report-create.component';

@Component({
  selector: 'app-worker-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, WorkerReportCreateComponent],
  templateUrl: './worker-reports.component.html',
  styleUrl: './worker-reports.component.scss'
})
export class WorkerReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private clientService = inject(ClientService);
  private authService = inject(AuthService);

  reports = signal<Report[]>([]);
  clients = signal<Client[]>([]);
  isLoading = signal(true);
  showCreate = signal(false);

  // Filters
  filterTipo = signal('');
  filterCliente = signal('');
  filterFechaInicio = signal('');
  filterFechaFin = signal('');
  showFilters = signal(false);

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
    const filters: any = { trabajador_id: user.id };
    if (this.filterTipo()) filters.tipo_informe = this.filterTipo();
    if (this.filterCliente()) filters.cliente_id = this.filterCliente();
    if (this.filterFechaInicio()) filters.fecha_inicio = this.filterFechaInicio();
    if (this.filterFechaFin()) filters.fecha_fin = this.filterFechaFin();

    this.reportService.getReports(filters).subscribe({
      next: (data) => {
        this.reports.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching reports', err);
        this.isLoading.set(false);
      }
    });
  }

  applyFilters() {
    this.loadReports();
    this.showFilters.set(false); // Opt-in: Close filters in mobile after applying
  }

  clearFilters() {
    this.filterTipo.set('');
    this.filterCliente.set('');
    this.filterFechaInicio.set('');
    this.filterFechaFin.set('');
    this.loadReports();
  }

  onReportCreated() {
    this.loadReports();
  }
}
