import { Component, EventEmitter, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService, Client, Elevator } from '../../services/client.service';
import { TechnicianService, Technician } from '../../services/technician.service';
import { ReportService } from '../../services/report.service';
import { computed } from '@angular/core';
import { SearchableSelectComponent } from '../../../../shared/components/searchable-select/searchable-select.component';
import { MaintenanceChecklistComponent } from '../../../../shared/components/maintenance-checklist/maintenance-checklist.component';
import { ModalWrapperComponent } from '../../../../shared/components/modal-wrapper/modal-wrapper.component';

@Component({
  selector: 'app-document-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent, MaintenanceChecklistComponent, ModalWrapperComponent],
  templateUrl: './document-create.component.html',
  styleUrl: './document-create.component.scss'
})
export class DocumentCreateComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() reportCreated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private technicianService = inject(TechnicianService);
  private reportService = inject(ReportService);

  createForm: FormGroup;
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // Data Sources
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

  // Maintenance Checklist Signals
  maintenanceChecklist = signal<any[]>([]);
  loadingChecklist = signal(false);

  groupedChecklist = computed(() => {
    // Ya no se necesita el agrupado aquí, se movió al componente
    return [];
  });

  constructor() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const localToday = `${year}-${month}-${day}`;

    this.createForm = this.fb.group({
      cliente_id: ['', [Validators.required]],
      ascensor_id: ['', [Validators.required]],
      trabajador_id: ['', [Validators.required]],
      tipo_informe: ['Técnico', [Validators.required]],
      descripcion_trabajo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
      observaciones: ['', [Validators.maxLength(1000)]],
      fecha_informe: [localToday, [Validators.required]],
      hora_informe: ['12:00', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    
    // Escuchar cambios en tipo_informe para ajustar validaciones y cargar checklist
    this.createForm.get('tipo_informe')?.valueChanges.subscribe(tipo => {
      this.onTipoInformeChange(tipo);
    });
  }

  onTipoInformeChange(tipo: string) {
    const descControl = this.createForm.get('descripcion_trabajo');
    if (tipo === 'Mantenimiento') {
      descControl?.clearValidators();
      descControl?.setValidators([Validators.maxLength(5000)]);
      this.loadMaintenanceChecklist();
    } else {
      descControl?.setValidators([Validators.required, Validators.minLength(10), Validators.maxLength(5000)]);
      this.maintenanceChecklist.set([]);
    }
    descControl?.updateValueAndValidity();
  }

  loadMaintenanceChecklist() {
    this.loadingChecklist.set(true);
    this.reportService.getStandardTasks().subscribe({
      next: (tasks) => {
        // Transformar TareaMaestra en estructura de Detalle (sin orden_id aún)
        const details = tasks.map(t => ({
          tarea_maestra_id: t.tarea_id, 
          realizado: false,
          TareaMaestra: t,
          categoria: t.categoria // Helper para el agrupado
        }));
        this.maintenanceChecklist.set(details);
        this.loadingChecklist.set(false);
      },
      error: (err) => {
        console.error('Error loading standard tasks', err);
        this.loadingChecklist.set(false);
      }
    });
  }

  toggleTask(task: any) {
    task.realizado = !task.realizado;
    this.maintenanceChecklist.set([...this.maintenanceChecklist()]);
  }

  toggleCategory(group: any, isChecked: boolean) {
    group.tasks.forEach((t: any) => t.realizado = isChecked);
    this.maintenanceChecklist.set([...this.maintenanceChecklist()]);
  }

  isCategoryComplete(group: { categoria: string, tasks: any[] }): boolean {
    return false; // Obsoleto, delegado al componente
  }

  trackByGroup(index: number, group: any): string {
    return group.categoria;
  }

  trackByTask(index: number, task: any): number {
    return task.tarea_maestra_id || task.tarea_id;
  }

  loadInitialData() {
    this.clientService.getClients().subscribe({
      next: (data) => this.clients.set(data),
      error: (err) => console.error('Error loading clients', err)
    });

    this.technicianService.getTechnicians({ estado_activo: true }).subscribe({
      next: (data) => this.technicians.set(data),
      error: (err) => console.error('Error loading technicians', err)
    });

    this.clientService.getElevators().subscribe({
        next: (data) => {
            this.allElevators.set(data);
            // If client is already selected (unlikely on init), filter
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
    if (!tech || !tech.id) return;
    this.createForm.patchValue({ trabajador_id: tech.id });
  }

  displayClient(client: Client): string {
    return client.nombre_comercial || client.contacto_nombre || '';
  }

  displayClientID(client: Client): string {
    return client.ruc || client.dni || 'Sin ID';
  }

  displayTech(tech: Technician): string {
    return `${tech.nombre} ${tech.apellido}`;
  }

  displayTechSpecialty(tech: Technician): string {
    return tech.especialidad || '';
  }

  closeDropdowns() {
    // Timeout to allow click event to register
    setTimeout(() => {
      this.showClientDropdown.set(false);
      this.showTechnicianDropdown.set(false);
    }, 200); 
  }

  filterElevators(clientId: number | string) {
    if (!clientId) {
        this.clientElevators.set([]);
        this.createForm.get('ascensor_id')?.disable();
        return;
    }
    
    // Ensure ID comparison works (string vs number)
    const filtered = this.allElevators().filter(e => e.cliente_id == clientId);
    this.clientElevators.set(filtered);
    
    if (filtered.length > 0) {
        this.createForm.get('ascensor_id')?.enable();
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
    
    // Validate IDs against loaded data to be absolutely sure
    const selectedClientId = Number(rawData.cliente_id);
    const selectedElevatorId = Number(rawData.ascensor_id);
    const selectedWorkerId = Number(rawData.trabajador_id);

    const clientExists = this.clients().find(c => c.cliente_id === selectedClientId);
    const elevatorExists = this.allElevators().find(e => e.ascensor_id === selectedElevatorId);
    const workerExists = this.technicians().find(t => t.id === selectedWorkerId);

    if (!clientExists || !elevatorExists || !workerExists) {
        this.error.set('Error: ID de entidad no válido. Por favor seleccione nuevamente de la lista.');
        return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    // Construct payload
    const payload = {
        ...rawData,
        cliente_id: selectedClientId,
        ascensor_id: selectedElevatorId,
        trabajador_id: selectedWorkerId,
        tipo_informe: rawData.tipo_informe,
        detalles: rawData.tipo_informe === 'Mantenimiento' ? this.maintenanceChecklist().map(d => ({
            tarea_maestra_id: d.tarea_maestra_id || d.tarea_id,
            realizado: !!d.realizado,
            observaciones: d.observaciones || ''
        })) : null
    };
    
    console.log('Sending Report Payload:', payload);

    this.reportService.createReport(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.reportCreated.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error creating report', err);
        const errorMsg = err.error?.message || err.message || 'Error desconocido';
        const details = err.error?.details ? ` (${JSON.stringify(err.error.details)})` : '';
        this.error.set(`Error al crear el documento: ${errorMsg}${details}`);
        this.isSubmitting.set(false);
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
