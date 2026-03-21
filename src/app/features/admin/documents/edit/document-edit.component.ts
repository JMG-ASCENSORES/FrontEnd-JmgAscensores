import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService, Client, Elevator } from '../../services/client.service';
import { TechnicianService, Technician } from '../../services/technician.service';
import { ReportService } from '../../services/report.service';
import { Report } from '../../../../core/models/report.model';

@Component({
  selector: 'app-document-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './document-edit.component.html',
  styleUrl: './document-edit.component.scss'
})
export class DocumentEditComponent implements OnInit {
  @Input({ required: true }) report!: Report;
  @Output() close = new EventEmitter<void>();
  @Output() reportUpdated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private technicianService = inject(TechnicianService);
  private reportService = inject(ReportService);

  editForm: FormGroup;
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  clients = signal<Client[]>([]);
  technicians = signal<Technician[]>([]);
  allElevators = signal<Elevator[]>([]);
  // Dependent Data
  clientElevators = signal<Elevator[]>([]);

  // Autocomplete State
  clientSearch = signal('');
  showClientDropdown = signal(false);
  filteredClients = signal<Client[]>([]);

  technicianSearch = signal('');
  showTechnicianDropdown = signal(false);
  filteredTechnicians = signal<Technician[]>([]);

  constructor() {
    this.editForm = this.fb.group({
      cliente_id: ['', [Validators.required]],
      ascensor_id: ['', [Validators.required]],
      trabajador_id: ['', [Validators.required]],
      tipo_informe: ['', [Validators.required]],
      descripcion_trabajo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
      observaciones: ['', [Validators.maxLength(1000)]],
      fecha_informe: ['', [Validators.required]],
      hora_informe: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
      this.loadInitialData();

      // Listen to client changes to update elevator list
       this.editForm.get('cliente_id')?.valueChanges.subscribe(clientId => {
        this.filterElevators(clientId);
      });
  }

  loadInitialData() {
    const reportData = this.report;
    let dateStr = '';
    if (reportData.fecha_informe) {
        const d = new Date(reportData.fecha_informe);
        if (!isNaN(d.getTime())) {
             dateStr = d.toISOString().split('T')[0];
        } else {
             dateStr = reportData.fecha_informe.toString().substring(0, 10);
        }
    }

    this.editForm.patchValue({
      cliente_id: reportData.cliente_id,
      ascensor_id: reportData.ascensor_id,
      trabajador_id: reportData.trabajador_id,
      tipo_informe: reportData.tipo_informe,
      descripcion_trabajo: reportData.descripcion_trabajo,
      observaciones: reportData.observaciones,
      fecha_informe: dateStr,
      hora_informe: reportData.hora_informe || '12:00'
    });
    
    // Load Clients
    this.clientService.getClients().subscribe({
        next: (data) => {
            this.clients.set(data);
            this.filteredClients.set(data);
             // Set initial search value for client
             if (reportData) {
                const client = data.find(c => c.cliente_id === reportData.cliente_id);
                if (client) {
                    this.clientSearch.set(client.nombre_comercial || client.contacto_nombre || '');
                }
             }
        },
        error: (err) => console.error('Error loading clients', err)
    });

    // Load Technicians
    this.technicianService.getTechnicians().subscribe({
        next: (data) => {
            this.technicians.set(data);
             this.filteredTechnicians.set(data);
            // Set initial search value for technician
            if (reportData) {
                const tech = data.find(t => t.id === reportData.trabajador_id);
                if (tech) {
                    this.technicianSearch.set(`${tech.nombre} ${tech.apellido}`);
                }
            }
        },
        error: (err) => console.error('Error loading technicians', err)
    });

    // Load Elevators
    this.clientService.getElevators().subscribe({
        next: (data) => {
            this.allElevators.set(data);
             // Re-apply filter after data loads if form has value
             const currentClientId = this.editForm.get('cliente_id')?.value;
             if (currentClientId) {
                 this.filterElevators(currentClientId);
             }
        },
        error: (err) => console.error('Error loading elevators', err)
    });
  }

  // Client Autocomplete Logic
  onClientSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.clientSearch.set(query);
    this.showClientDropdown.set(true);

    if (!query) {
      this.filteredClients.set([]);
      return;
    }

    const filtered = this.clients().filter(c => 
      (c.nombre_comercial?.toLowerCase().includes(query) || 
       c.contacto_nombre?.toLowerCase().includes(query))
    );
    this.filteredClients.set(filtered);
  }

  selectClient(client: Client) {
    this.editForm.patchValue({ cliente_id: client.cliente_id });
    this.clientSearch.set(client.nombre_comercial || client.contacto_nombre || '');
    this.showClientDropdown.set(false);
    this.filterElevators(client.cliente_id); 
  }

  // Technician Autocomplete Logic
  onTechnicianSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.technicianSearch.set(query);
    this.showTechnicianDropdown.set(true);

    if (!query) {
       this.filteredTechnicians.set([]);
      return;
    }

    const filtered = this.technicians().filter(t => 
      (t.nombre.toLowerCase().includes(query) || 
       t.apellido.toLowerCase().includes(query) ||
       t.dni.includes(query))
    );
    this.filteredTechnicians.set(filtered);
  }

  selectTechnician(tech: Technician) {
    this.editForm.patchValue({ trabajador_id: tech.id });
    this.technicianSearch.set(`${tech.nombre} ${tech.apellido}`);
    this.showTechnicianDropdown.set(false);
  }

  closeDropdowns() {
    setTimeout(() => {
      this.showClientDropdown.set(false);
      this.showTechnicianDropdown.set(false);
    }, 200); 
  }

  filterElevators(clientId: number | string) {
    if (!clientId) {
      this.clientElevators.set([]);
      this.editForm.get('ascensor_id')?.disable();
      return;
    }
    const filtered = this.allElevators().filter(e => e.cliente_id == clientId);
    this.clientElevators.set(filtered);
    this.editForm.get('ascensor_id')?.enable();
  }

  // Renamed to avoid confusion with submit logic which is below
  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const rawData = this.editForm.getRawValue();
    if (!rawData.cliente_id || !rawData.ascensor_id || !rawData.trabajador_id) {
       this.error.set('Por favor complete todos los campos requeridos (Cliente, Ascensor, Técnico).');
       return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const payload = {
        ...rawData,
        cliente_id: Number(rawData.cliente_id),
        ascensor_id: Number(rawData.ascensor_id),
        trabajador_id: Number(rawData.trabajador_id),
        tipo_informe: rawData.tipo_informe,
    };

    this.reportService.updateReport(this.report.informe_id, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.reportUpdated.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error updating report', err);
        const errorMsg = err.error?.message || err.message || 'Error desconocido';
        const details = err.error?.details ? ` (${JSON.stringify(err.error.details)})` : '';
        this.error.set(`Error al actualizar el documento: ${errorMsg}${details}`);
        this.isSubmitting.set(false);
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
