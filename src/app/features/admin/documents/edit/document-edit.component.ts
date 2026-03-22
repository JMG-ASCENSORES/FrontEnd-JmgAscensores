import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService, Client, Elevator } from '../../services/client.service';
import { TechnicianService, Technician } from '../../services/technician.service';
import { ReportService } from '../../services/report.service';
import { SearchableSelectComponent } from '../../../../shared/components/searchable-select/searchable-select.component';
import { MaintenanceChecklistComponent } from '../../../../shared/components/maintenance-checklist/maintenance-checklist.component';
import { ModalWrapperComponent } from '../../../../shared/components/modal-wrapper/modal-wrapper.component';
import { Report } from '../../../../core/models/report.model';
import { computed } from '@angular/core';

@Component({
  selector: 'app-document-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent, MaintenanceChecklistComponent, ModalWrapperComponent],
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

  // Maintenance Checklist Signals
  maintenanceChecklist = signal<any[]>([]);
  loadingChecklist = signal(false);
  isChecklistDirty = signal(false);

  groupedChecklist = computed(() => {
    // Delegado al componente
    return [];
  });

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
      
      // Cargar reporte completo por ID para asegurar que tenemos OrdenTrabajo.detalles
      this.reportService.getReportById(this.report.informe_id).subscribe({
        next: (fullReport) => {
          this.report = fullReport;
          this.patchFormWithReportData(); // Re-parchear con datos completos del servidor
          if (this.report.tipo_informe === 'Mantenimiento') {
             this.onTipoInformeChange('Mantenimiento');
          }
        },
        error: (err) => console.error('Error loading full report', err)
      });

      // Listen to client changes to update elevator list
       this.editForm.get('cliente_id')?.valueChanges.subscribe(clientId => {
        this.filterElevators(clientId);
      });

      // Escuchar cambios en tipo_informe para ajustar validaciones
      this.editForm.get('tipo_informe')?.valueChanges.subscribe(tipo => {
        this.onTipoInformeChange(tipo);
      });

      // Inicializar estado del checklist si ya es mantenimiento
      if (this.report.tipo_informe === 'Mantenimiento') {
        this.onTipoInformeChange('Mantenimiento');
      }
  }

  onTipoInformeChange(tipo: string) {
    const descControl = this.editForm.get('descripcion_trabajo');
    if (tipo === 'Mantenimiento') {
      descControl?.clearValidators();
      descControl?.setValidators([Validators.maxLength(5000)]);
      
      // Si ya tiene detalles en el reporte, cargarlos
      if (this.report.OrdenTrabajo?.detalles) {
        this.maintenanceChecklist.set(this.report.OrdenTrabajo.detalles);
      } else if (this.maintenanceChecklist().length === 0) {
        // Si no tiene detalles pero es mantenimiento (caso raro en edición), cargar estándares
        this.loadStandardTasks();
      }
    } else {
      descControl?.setValidators([Validators.required, Validators.minLength(10), Validators.maxLength(5000)]);
      this.maintenanceChecklist.set([]);
    }
    descControl?.updateValueAndValidity();
  }

  loadStandardTasks() {
    this.loadingChecklist.set(true);
    this.reportService.getStandardTasks().subscribe({
      next: (tasks) => {
        const details = tasks.map(t => ({
          tarea_maestra_id: t.tarea_id,
          realizado: false,
          TareaMaestra: t
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
    this.isChecklistDirty.set(true);
    this.maintenanceChecklist.set([...this.maintenanceChecklist()]);
  }

  toggleCategory(group: any, isChecked: boolean) {
    group.tasks.forEach((t: any) => {
      t.realizado = isChecked;
    });
    this.isChecklistDirty.set(true);
    this.maintenanceChecklist.set([...this.maintenanceChecklist()]);
  }

  isCategoryComplete(group: { categoria: string, tasks: any[] }): boolean {
    if (!group.tasks || group.tasks.length === 0) return false;
    return group.tasks.every(t => t.realizado);
  }

  loadInitialData() {
    this.patchFormWithReportData();
    
    // Load Clients
    this.clientService.getClients().subscribe({
        next: (data) => {
            this.clients.set(data);
            // Set initial search value for client
            if (this.report) {
                const client = data.find(c => c.cliente_id === this.report.cliente_id);
                if (client) {
                    // this.clientSearch.set(client.nombre_comercial || client.contacto_nombre || ''); // No longer needed
                    this.editForm.get('cliente_id')?.setValue(client.cliente_id); // Ensure form control is set
                }
            }
        },
        error: (err) => console.error('Error loading clients', err)
    });

    // Load Technicians
    this.technicianService.getTechnicians().subscribe({
        next: (data) => {
            this.technicians.set(data);
            // Set initial search value for technician
            if (this.report) {
                const tech = data.find(t => t.id === this.report.trabajador_id);
                if (tech) {
                    // this.technicianSearch.set(`${tech.nombre} ${tech.apellido}`); // No longer needed
                    this.editForm.get('trabajador_id')?.setValue(tech.id); // Ensure form control is set
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

  trackByGroup(index: number, group: any): string {
    return group.categoria;
  }

  trackByTask(index: number, task: any): number {
    return task.tarea_maestra_id || task.tarea_id;
  }

  patchFormWithReportData() {
    const reportData = this.report;
    let dateStr = '';
    if (reportData.fecha_informe) {
        // Formateo estrictamente manual para evitar el desfase UTC-5
        const fullDateStr = String(reportData.fecha_informe);
        dateStr = fullDateStr.split('T')[0];
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
  }

  // Client Autocomplete Logic (delegated to SearchableSelectComponent)
  displayClient(client: Client): string {
    return client.nombre_comercial || client.contacto_nombre || '';
  }

  displayClientID(client: Client): string {
    return client.ruc || client.dni || 'Sin ID';
  }

  selectClient(client: Client) {
    if (!client || !client.cliente_id) return;
    this.editForm.patchValue({ cliente_id: client.cliente_id });
    this.filterElevators(client.cliente_id); 
  }

  // Technician Autocomplete Logic (delegated to SearchableSelectComponent)
  displayTech(tech: Technician): string {
    return `${tech.nombre} ${tech.apellido}`;
  }

  displayTechSpecialty(tech: Technician): string {
    return tech.especialidad || '';
  }

  selectTechnician(tech: Technician) {
    if (!tech || !tech.id) return;
    this.editForm.patchValue({ trabajador_id: tech.id });
  }

  // closeDropdowns() { // No longer needed, handled by SearchableSelectComponent
  //   setTimeout(() => {
  //     this.showClientDropdown.set(false);
  //     this.showTechnicianDropdown.set(false);
  //   }, 200); 
  // }

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

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const rawData = this.editForm.getRawValue();
    const payload: any = {};
    
    // Extraer solo campos modificados del formulario
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
      if (control?.dirty) {
        payload[key] = control.value;
      }
    });

    // Castear FKs si fueron alteradas
    if (payload.cliente_id) payload.cliente_id = Number(payload.cliente_id);
    if (payload.ascensor_id) payload.ascensor_id = Number(payload.ascensor_id);
    if (payload.trabajador_id) payload.trabajador_id = Number(payload.trabajador_id);

    // Incluir la checklist SOLO si el usuario interactuó con ella
    if (rawData.tipo_informe === 'Mantenimiento' && this.isChecklistDirty()) {
      payload.detalles = this.maintenanceChecklist().map(d => ({
        tarea_maestra_id: d.tarea_maestra_id || d.tarea_id,
        realizado: !!d.realizado,
        observaciones: d.observaciones || ''
      }));
    }

    // Optimización: Si no hubo ningún cambio, no emitir request a red
    if (Object.keys(payload).length === 0) {
      this.isSubmitting.set(false);
      this.close.emit();
      return;
    }

    this.reportService.patchReport(this.report.informe_id, payload).subscribe({
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
