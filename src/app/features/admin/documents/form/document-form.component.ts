import { Component, EventEmitter, Input, Output, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService, Client, Elevator } from '../../services/client.service';
import { TechnicianService, Technician } from '../../services/technician.service';
import { ReportService } from '../../services/report.service';
import { SearchableSelectComponent } from '../../../../shared/components/searchable-select/searchable-select.component';
import { MaintenanceChecklistComponent } from '../../../../shared/components/maintenance-checklist/maintenance-checklist.component';
import { ModalWrapperComponent } from '../../../../shared/components/modal-wrapper/modal-wrapper.component';
import { Report } from '../../../../core/models/report.model';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent, MaintenanceChecklistComponent, ModalWrapperComponent],
  templateUrl: './document-form.component.html',
  styleUrl: './document-form.component.scss'
})
export class DocumentFormComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() report?: Report;
  
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private technicianService = inject(TechnicianService);
  private reportService = inject(ReportService);

  form: FormGroup;
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // Data Sources
  clients = signal<Client[]>([]);
  technicians = signal<Technician[]>([]);
  allElevators = signal<Elevator[]>([]);
  
  // Dependent Data
  clientElevators = signal<Elevator[]>([]);

  // Maintenance Checklist Signals
  maintenanceChecklist = signal<any[]>([]);
  loadingChecklist = signal(false);
  isChecklistDirty = signal(false);

  constructor() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const localToday = `${year}-${month}-${day}`;

    this.form = this.fb.group({
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

    if (this.mode === 'edit' && this.report) {
      // Cargar reporte completo por ID para asegurar que tenemos OrdenTrabajo.detalles
      this.reportService.getReportById(this.report.informe_id).subscribe({
        next: (fullReport) => {
          this.report = fullReport;
          this.patchFormWithReportData();
          if (this.report.tipo_informe === 'Mantenimiento') {
             this.onTipoInformeChange('Mantenimiento', false);
          }
        },
        error: (err) => console.error('Error loading full report', err)
      });
    } else {
      // Create mode
      if (this.form.get('tipo_informe')?.value === 'Mantenimiento') {
        this.onTipoInformeChange('Mantenimiento', true);
      }
    }

    // Listeners
    this.form.get('cliente_id')?.valueChanges.subscribe(clientId => {
      this.filterElevators(clientId);
    });

    this.form.get('tipo_informe')?.valueChanges.subscribe(tipo => {
      this.onTipoInformeChange(tipo, true);
    });
  }

  onTipoInformeChange(tipo: string, resetChecklist: boolean) {
    const descControl = this.form.get('descripcion_trabajo');
    if (tipo === 'Mantenimiento') {
      descControl?.clearValidators();
      descControl?.setValidators([Validators.maxLength(5000)]);
      
      if (this.mode === 'edit' && this.report?.OrdenTrabajo?.detalles && !resetChecklist) {
        this.maintenanceChecklist.set(this.report.OrdenTrabajo.detalles);
      } else {
        this.loadStandardTasks();
      }
    } else {
      descControl?.setValidators([Validators.required, Validators.minLength(10), Validators.maxLength(5000)]);
      this.maintenanceChecklist.set([]);
    }
    descControl?.updateValueAndValidity();
    if (resetChecklist) this.isChecklistDirty.set(true);
  }

  loadStandardTasks() {
    this.loadingChecklist.set(true);
    this.reportService.getStandardTasks().subscribe({
      next: (tasks) => {
        const details = tasks.map(t => ({
          tarea_maestra_id: t.tarea_id,
          realizado: false,
          TareaMaestra: t,
          categoria: t.categoria
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
    group.tasks.forEach((t: any) => t.realizado = isChecked);
    this.isChecklistDirty.set(true);
    this.maintenanceChecklist.set([...this.maintenanceChecklist()]);
  }

  trackByGroup(index: number, group: any): string {
    return group.categoria;
  }

  trackByTask(index: number, task: any): number {
    return task.tarea_maestra_id || task.tarea_id;
  }

  loadInitialData() {
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients.set(data);
        if (this.mode === 'edit' && this.report) {
          const client = data.find(c => c.cliente_id === this.report!.cliente_id);
          if (client) this.form.get('cliente_id')?.setValue(client.cliente_id);
        }
      },
      error: (err) => console.error('Error loading clients', err)
    });

    this.technicianService.getTechnicians({ estado_activo: true }).subscribe({
      next: (data) => {
        this.technicians.set(data);
        if (this.mode === 'edit' && this.report) {
          const tech = data.find(t => t.id === this.report!.trabajador_id);
          if (tech) this.form.get('trabajador_id')?.setValue(tech.id);
        }
      },
      error: (err) => console.error('Error loading technicians', err)
    });

    this.clientService.getElevators().subscribe({
      next: (data) => {
          this.allElevators.set(data);
          const currentClient = this.form.get('cliente_id')?.value;
          if (currentClient) this.filterElevators(currentClient);
      },
      error: (err) => console.error('Error loading elevators', err)
    });
  }

  patchFormWithReportData() {
    if (!this.report) return;
    const reportData = this.report;
    let dateStr = '';
    if (reportData.fecha_informe) {
        const fullDateStr = String(reportData.fecha_informe);
        dateStr = fullDateStr.split('T')[0];
    }

    this.form.patchValue({
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

  selectClient(client: Client) {
    if (!client || !client.cliente_id) return;
    this.form.patchValue({ cliente_id: client.cliente_id });
    this.filterElevators(client.cliente_id); 
  }

  selectTechnician(tech: Technician) {
    if (!tech || !tech.id) return;
    this.form.patchValue({ trabajador_id: tech.id });
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


  filterElevators(clientId: number | string) {
    if (!clientId) {
        this.clientElevators.set([]);
        this.form.get('ascensor_id')?.disable();
        return;
    }
    const filtered = this.allElevators().filter(e => e.cliente_id == clientId);
    this.clientElevators.set(filtered);
    
    if (filtered.length > 0) {
        this.form.get('ascensor_id')?.enable();
    } else {
        this.form.get('ascensor_id')?.disable();
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawData = this.form.getRawValue();
    const selectedClientId = Number(rawData.cliente_id);
    const selectedElevatorId = Number(rawData.ascensor_id);
    const selectedWorkerId = Number(rawData.trabajador_id);

    const clientExists = this.clients().find(c => c.cliente_id === selectedClientId);
    const elevatorExists = this.allElevators().find(e => e.ascensor_id === selectedElevatorId);
    const workerExists = this.technicians().find(t => t.id === selectedWorkerId);

    if (!clientExists || !elevatorExists || !workerExists) {
        this.error.set('Error: ID de entidad no válido.');
        return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    if (this.mode === 'create') {
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

      this.reportService.createReport(payload).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err, 'crear')
      });
    } else {
      const payload: any = {};
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.dirty) {
          payload[key] = control.value;
        }
      });

      if (payload.cliente_id) payload.cliente_id = Number(payload.cliente_id);
      if (payload.ascensor_id) payload.ascensor_id = Number(payload.ascensor_id);
      if (payload.trabajador_id) payload.trabajador_id = Number(payload.trabajador_id);

      if (rawData.tipo_informe === 'Mantenimiento' && this.isChecklistDirty()) {
        payload.detalles = this.maintenanceChecklist().map(d => ({
            tarea_maestra_id: d.tarea_maestra_id || d.tarea_id,
            realizado: !!d.realizado,
            observaciones: d.observaciones || ''
        }));
      }

      if (Object.keys(payload).length === 0) {
        this.isSubmitting.set(false);
        this.close.emit();
        return;
      }

      this.reportService.patchReport(this.report!.informe_id, payload).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err, 'actualizar')
      });
    }
  }

  private handleSuccess() {
    this.isSubmitting.set(false);
    this.saved.emit();
    this.close.emit();
  }

  private handleError(err: any, action: string) {
    console.error(`Error al ${action} reporte`, err);
    const errorMsg = err.error?.message || err.message || 'Error desconocido';
    const details = err.error?.details ? ` (${JSON.stringify(err.error.details)})` : '';
    this.error.set(`Error al ${action} el documento: ${errorMsg}${details}`);
    this.isSubmitting.set(false);
  }

  onClose() {
    this.close.emit();
  }
}
