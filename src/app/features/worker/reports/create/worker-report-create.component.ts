import { Component, EventEmitter, Output, Input, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService, Client, Elevator } from '../../../admin/services/client.service';
import { ReportService } from '../../../admin/services/report.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-worker-report-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './worker-report-create.component.html',
  styleUrl: './worker-report-create.component.scss'
})
export class WorkerReportCreateComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() reportCreated = new EventEmitter<void>();
  @Input() prefilledData: any = null;

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private reportService = inject(ReportService);
  private authService = inject(AuthService);

  createForm: FormGroup;
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  clients = signal<Client[]>([]);
  allElevators = signal<Elevator[]>([]);
  clientElevators = signal<Elevator[]>([]);

  // Autocomplete state for Client
  clientSearch = signal('');
  showClientDropdown = signal(false);
  filteredClients = signal<Client[]>([]);

  constructor() {
    this.createForm = this.fb.group({
      cliente_id: ['', [Validators.required]],
      ascensor_id: ['', [Validators.required]],
      orden_id: [''],
      tipo_informe: ['Técnico', [Validators.required]],
      descripcion_trabajo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
      observaciones: ['', [Validators.maxLength(1000)]],
      fecha_informe: [new Date().toISOString().split('T')[0], [Validators.required]],
      hora_informe: ['12:00', [Validators.required]]
    });
  }

  ngOnInit(): void {
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    if (this.prefilledData) {
      this.createForm.patchValue({
        cliente_id: this.prefilledData.cliente_id,
        ascensor_id: this.prefilledData.ascensor_id,
        orden_id: this.prefilledData.orden_id,
        tipo_informe: this.prefilledData.tipo_informe || 'Técnico'
      });
      if (this.prefilledData.cliente_nombre) {
        this.clientSearch.set(this.prefilledData.cliente_nombre);
      }
      this.createForm.get('cliente_id')?.disable();
      this.createForm.get('ascensor_id')?.disable();
    }
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = ''; // Restore
  }

  loadInitialData() {
    this.clientService.getClients().subscribe({
      next: (data) => this.clients.set(data),
      error: (err) => console.error('Error loading clients', err)
    });

    this.clientService.getElevators().subscribe({
        next: (data) => {
            this.allElevators.set(data);
            const currentClient = this.createForm.get('cliente_id')?.value;
            if (currentClient) this.filterElevators(currentClient);
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
    if (!client || !client.cliente_id) return;
    this.createForm.patchValue({ cliente_id: client.cliente_id });
    this.clientSearch.set(client.nombre_comercial || client.contacto_nombre || '');
    this.showClientDropdown.set(false);
    this.filterElevators(client.cliente_id); 
  }

  closeDropdowns() {
    setTimeout(() => {
      this.showClientDropdown.set(false);
    }, 200); 
  }

  filterElevators(clientId: number | string) {
    if (!clientId) {
        this.clientElevators.set([]);
        this.createForm.get('ascensor_id')?.disable();
        return;
    }
    const filtered = this.allElevators().filter(e => e.cliente_id == clientId);
    this.clientElevators.set(filtered);
    
    if (filtered.length > 0) {
        if (!this.prefilledData) {
            this.createForm.get('ascensor_id')?.enable();
        }
    } else {
        this.createForm.get('ascensor_id')?.disable();
    }
  }

  onSubmit() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const rawData = this.createForm.getRawValue();
    const currentUser = this.authService.currentUser();
    
    const selectedClientId = Number(rawData.cliente_id);
    const selectedElevatorId = Number(rawData.ascensor_id);

    // Current worker ID
    const selectedWorkerId = currentUser ? currentUser.id : null;

    if (!selectedWorkerId) {
        this.error.set('Error: No se pudo identificar al trabajador actual.');
        return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const payload = {
        ...rawData,
        cliente_id: selectedClientId,
        ascensor_id: selectedElevatorId,
        trabajador_id: selectedWorkerId,
        tipo_informe: rawData.tipo_informe,
    };
    if (rawData.orden_id) {
        payload.orden_id = Number(rawData.orden_id);
    }
    
    this.reportService.createReport(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.reportCreated.emit();
        this.onClose();
      },
      error: (err) => {
        const errorMsg = err.error?.message || err.message || 'Error desconocido';
        const details = err.error?.details ? ` (${JSON.stringify(err.error.details)})` : '';
        this.error.set(`Error al crear el informe: ${errorMsg}${details}`);
        this.isSubmitting.set(false);
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
