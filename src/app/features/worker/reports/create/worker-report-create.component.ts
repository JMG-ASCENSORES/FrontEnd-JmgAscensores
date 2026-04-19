import { LucideAngularModule } from 'lucide-angular';
import { limaDateStr } from '../../../../shared/utils/date-lima.util';
import { Component, EventEmitter, Output, Input, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import SignaturePad from 'signature_pad';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService, Client, Elevator } from '../../../admin/services/client.service';
import { ReportService } from '../../../admin/services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WorkerService, WorkerProfile } from '../../services/worker.service';

import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-worker-report-create',
  standalone: true,
  imports: [ReactiveFormsModule, LoadingSpinnerComponent,
    LucideAngularModule
  ],
  templateUrl: './worker-report-create.component.html',
  styleUrl: './worker-report-create.component.scss'
})
export class WorkerReportCreateComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('techCanvas') techCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('clientCanvas') clientCanvas!: ElementRef<HTMLCanvasElement>;

  private techPad!: SignaturePad;
  private clientPad!: SignaturePad;
  @Output() close = new EventEmitter<void>();
  @Output() reportCreated = new EventEmitter<void>();
  @Input() prefilledData: any = null;
  @Input() editingId: number | null = null;

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private workerService = inject(WorkerService);

  createForm: FormGroup;
  isSubmitting = signal(false);
  isEditing = signal(false);
  error = signal<string | null>(null);

  // Signatures State
  defaultTechSignatureId = signal<number | null>(null);
  useDefaultTechSignature = signal<boolean>(false);
  
  lastClientSignatureId = signal<number | null>(null);
  useLastClientSignature = signal<boolean>(false);

  clients = signal<Client[]>([]);
  allElevators = signal<Elevator[]>([]);
  clientElevators = signal<Elevator[]>([]);

  // Autocomplete state for Client
  clientSearch = signal('');
  showClientDropdown = signal(false);
  filteredClients = signal<Client[]>([]);

  // Maintenance Checklist State
  maintenanceChecklist = signal<any[]>([]); // DetalleOrden[]
  loadingChecklist = signal(false);
  isMaintenanceReport = signal(false);

  constructor() {
    this.createForm = this.fb.group({
      cliente_id: ['', [Validators.required]],
      ascensor_id: ['', [Validators.required]],
      orden_id: [''],
      tipo_informe: ['Técnico', [Validators.required]],
      descripcion_trabajo: ['', [Validators.maxLength(5000)]],
      observaciones: ['', [Validators.maxLength(1000)]],
      fecha_informe: [limaDateStr(), [Validators.required]],
      hora_informe: ['12:00', [Validators.required]]
    });
  }

  ngOnInit(): void {
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    if (this.editingId) {
      this.isEditing.set(true);
      // Fetch existing data
      this.reportService.getReportById(this.editingId).subscribe({
        next: (report: any) => {
          this.createForm.patchValue({
            cliente_id: report.cliente_id,
            ascensor_id: report.ascensor_id,
            orden_id: report.orden_id,
            tipo_informe: report.tipo_informe,
            descripcion_trabajo: report.descripcion_trabajo,
            observaciones: report.observaciones,
            fecha_informe: report.fecha_informe,
            hora_informe: report.hora_informe
          });
          
          if (report.tipo_informe === 'Mantenimiento') {
            this.isMaintenanceReport.set(true);
            const descControl = this.createForm.get('descripcion_trabajo');
            descControl?.setValidators([Validators.maxLength(5000)]);
            descControl?.updateValueAndValidity();
            if (report.orden_id) {
               this.loadChecklist(report.orden_id);
            }
          }
          const cliente = report.Cliente || report.cliente;
          if (cliente) {
              this.clientSearch.set(cliente.nombre_comercial || cliente.contacto_nombre);
          }
          this.createForm.get('cliente_id')?.disable();
          this.createForm.get('ascensor_id')?.disable();
          this.loadInitialData();
        },
        error: (err) => {
          console.error('Failed to load report for editing', err);
          this.error.set('No se pudo cargar la información del informe.');
        }
      });
    } else {
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

    // Check if it's a maintenance report to load checklist
    this.createForm.get('tipo_informe')?.valueChanges.subscribe(val => {
      const isMaint = val === 'Mantenimiento';
      this.isMaintenanceReport.set(isMaint);
      
      const descControl = this.createForm.get('descripcion_trabajo');
      if (isMaint) {
        descControl?.setValidators([Validators.maxLength(5000)]);
        if (!descControl?.value || descControl.value.length < 5) {
          descControl?.setValue('Mantenimiento preventivo realizado según checklist de inspección.');
        }
        if (this.createForm.get('orden_id')?.value) {
          this.loadChecklist(this.createForm.get('orden_id')?.value);
        }
      } else {
        descControl?.setValidators([Validators.required, Validators.minLength(10), Validators.maxLength(5000)]);
      }
      descControl?.updateValueAndValidity();
    });

    // Initial check for prefilled orden_id
    const initialOrdenId = this.createForm.get('orden_id')?.value;
    const initialTipo = this.createForm.get('tipo_informe')?.value;
    if (initialTipo === 'Mantenimiento') {
       this.isMaintenanceReport.set(true);
       const descControl = this.createForm.get('descripcion_trabajo');
       descControl?.setValidators([Validators.maxLength(5000)]);
       descControl?.updateValueAndValidity();
       if (initialOrdenId) {
          this.loadChecklist(initialOrdenId);
       }
    }

    // Always fetch profile signature if available
    this.workerService.getMyProfile().subscribe({
      next: (profile: WorkerProfile) => {
        if (profile.firma_defecto_id) {
          this.defaultTechSignatureId.set(profile.firma_defecto_id);
          // If NOT editing, or if editing but no signature yet, enable by default
          if (!this.editingId) {
            this.useDefaultTechSignature.set(true);
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = ''; // Restore
  }

  ngAfterViewInit(): void {
    this.techPad = new SignaturePad(this.techCanvas.nativeElement, {
      backgroundColor: 'rgb(255, 255, 255)',
      minWidth: 2,
      maxWidth: 5,
      penColor: '#1e293b'
    });
    this.clientPad = new SignaturePad(this.clientCanvas.nativeElement, {
      backgroundColor: 'rgb(255, 255, 255)',
      minWidth: 2,
      maxWidth: 5,
      penColor: '#1e293b'
    });
    this.resizeCanvas();
  }

  private resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    [this.techCanvas, this.clientCanvas].forEach(canvasRef => {
      const canvas = canvasRef.nativeElement;
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);
    });
    if (this.techPad) this.techPad.clear();
    if (this.clientPad) this.clientPad.clear();
  }

  clearSignature(type: 'tech' | 'client') {
    if (type === 'tech') this.techPad.clear();
    else this.clientPad.clear();
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

    if (query.length < 2) {
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

    // Try to find the last client signature
    this.reportService.getReports({ cliente_id: clientId, limit: 10 }).subscribe({
      next: (res) => {
         // Find the most recent report with a signature
         const reportWithSignature = res.informes.find((r: any) => r.firma_cliente_id != null);
         if (reportWithSignature) {
            this.lastClientSignatureId.set((reportWithSignature as any).firma_cliente_id);
            this.useLastClientSignature.set(true);
         } else {
            this.lastClientSignatureId.set(null);
            this.useLastClientSignature.set(false);
         }
      },
      error: () => {
         this.lastClientSignatureId.set(null);
         this.useLastClientSignature.set(false);
      }
    });
  }

  loadChecklist(ordenId: number) {
    if (!ordenId) return;
    this.loadingChecklist.set(true);
    this.reportService.getWorkOrderById(ordenId).subscribe({
      next: (order) => {
        if (order && order.detalles) {
          this.maintenanceChecklist.set(order.detalles);
        }
        this.loadingChecklist.set(false);
      },
      error: (err) => {
        console.error('Error loading checklist', err);
        this.loadingChecklist.set(false);
      }
    });
  }

  get groupedChecklist() {
    const checklist = this.maintenanceChecklist();
    const groups: { categoria: string, tasks: any[] }[] = [];
    
    checklist.forEach(item => {
      const cat = item.TareaMaestra?.categoria || 'General';
      let group = groups.find(g => g.categoria === cat);
      if (!group) {
        group = { categoria: cat, tasks: [] };
        groups.push(group);
      }
      group.tasks.push(item);
    });
    
    return groups;
  }

  toggleTask(task: any) {
    task.realizado = !task.realizado;
  }

  toggleCategory(group: { categoria: string, tasks: any[] }, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    group.tasks.forEach(t => t.realizado = isChecked);
  }

  isCategoryComplete(group: { categoria: string, tasks: any[] }): boolean {
    if (!group.tasks || group.tasks.length === 0) return false;
    return group.tasks.every(t => t.realizado);
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
    const selectedWorkerId = currentUser ? currentUser.id : null;

    if (!selectedWorkerId) {
        this.error.set('Error: No se pudo identificar al trabajador actual.');
        return;
    }

    if (!rawData.orden_id) {
        this.error.set('Error: El informe debe estar asociado a una orden de trabajo. Por favor, inicia este reporte desde una ruta asignada.');
        return;
    }

    // === LÓGICA DE FIRMA DEL TÉCNICO ===
    let firmaTecnico: string | null = null;
    let firmaTecnicoId: number | null = null;

    if (this.useDefaultTechSignature() && this.defaultTechSignatureId()) {
      // Caso 1: Reutilizar firma predeterminada (ya existe en BD)
      firmaTecnicoId = this.defaultTechSignatureId();
    } else if (!this.useDefaultTechSignature() && !this.techPad.isEmpty()) {
      // Caso 2: Nueva firma dibujada manualmente
      firmaTecnico = this.techPad.toDataURL('image/png');
    } else if (this.useDefaultTechSignature() && !this.defaultTechSignatureId()) {
      // Condición de carrera: el checkbox está marcado pero el ID aún no cargó
      this.error.set('Cargando firma del técnico, por favor espera un momento e intenta de nuevo.');
      return;
    }

    // En modo creación, la firma del técnico es obligatoria
    if (!firmaTecnico && !firmaTecnicoId && !this.isEditing()) {
        this.error.set('Error: La firma del técnico es obligatoria. Usa tu firma predeterminada o dibuja una nueva.');
        return;
    }

    // === LÓGICA DE FIRMA DEL CLIENTE ===
    let firmaCliente: string | null = null;
    let firmaClienteId: number | null = null;

    if (this.useLastClientSignature() && this.lastClientSignatureId()) {
      // Caso 1: Reutilizar última firma del cliente
      firmaClienteId = this.lastClientSignatureId();
    } else if (!this.useLastClientSignature() && !this.clientPad.isEmpty()) {
      // Caso 2: Nueva firma del cliente dibujada
      firmaCliente = this.clientPad.toDataURL('image/png');
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const payload: any = {
        ...rawData,
        cliente_id: selectedClientId,
        ascensor_id: selectedElevatorId,
        trabajador_id: selectedWorkerId,
        tipo_informe: rawData.tipo_informe,
        orden_id: rawData.orden_id ? Number(rawData.orden_id) : null
    };

    // Agregar datos de firma solo si existen
    if (firmaTecnico) payload.firma_tecnico = firmaTecnico;
    if (firmaTecnicoId) payload.firma_tecnico_id = firmaTecnicoId;
    if (firmaCliente) payload.firma_cliente = firmaCliente;
    if (firmaClienteId) payload.firma_cliente_id = firmaClienteId;

    console.log('[onSubmit] Payload firmas - firma_tecnico_id:', payload.firma_tecnico_id, '| firma_cliente_id:', payload.firma_cliente_id, '| firma_tecnico (tiene data):', !!payload.firma_tecnico);
    
    // Si es mantenimiento, actualizar los DetalleOrden primariamente
    if (this.isMaintenanceReport() && this.maintenanceChecklist().length > 0) {
        this.reportService.updateWorkOrder(payload.orden_id, { detalles: this.maintenanceChecklist() }).subscribe({
           error: (err) => console.error('Error updating checklist items', err)
        });
    }

    if (this.isEditing() && this.editingId) {
        this.reportService.updateReport(this.editingId, payload).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.reportCreated.emit();
            this.onClose();
          },
          error: (err) => {
            const errorMsg = err.error?.message || err.message || 'Error desconocido';
            const details = err.error?.details ? ` (${JSON.stringify(err.error.details)})` : '';
            this.error.set(`Error al actualizar el informe: ${errorMsg}${details}`);
            this.isSubmitting.set(false);
          }
        });
    } else {
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
  }


  onClose() {
    this.close.emit();
  }
}
