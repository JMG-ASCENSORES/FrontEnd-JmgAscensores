import { LucideAngularModule } from 'lucide-angular';
import { Component, OnInit, Input, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MantenimientoFijoService } from '../../services/mantenimiento-fijo.service';
import { TechnicianService } from '../../services/technician.service';
import { ElevatorService } from '../../services/elevator.service';
import { ClientService } from '../../services/client.service';
import { MantenimientoFijo } from '../../models/mantenimiento.interface';
import { Subject, debounceTime, distinctUntilChanged, switchMap, finalize, of } from 'rxjs';

@Component({
  selector: 'app-mantenimiento-fijo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './mantenimiento-fijo-modal.component.html',
  styleUrl: './mantenimiento-fijo-modal.component.scss'
})
export class MantenimientoFijoModalComponent implements OnInit {
  @Input() mantenimientoFijo: MantenimientoFijo | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private maintenanceService = inject(MantenimientoFijoService);
  private technicianService = inject(TechnicianService);
  private elevatorService = inject(ElevatorService);
  private clientService = inject(ClientService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    ascensor_id: [null, Validators.required],
    trabajador_id: [null],
    dia_mes: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    hora: ['08:00', Validators.required],
    frecuencia: ['mensual', Validators.required]
  });

  isEditMode = false;
  isSaving = false;
  isLoading = false;
  isSearchingClients = false;
  errorMessage = '';

  trabajadores: any[] = [];
  ascensores: any[] = [];
  foundClients: any[] = [];
  selectedClient: any = null;
  
  techSearch = '';
  clientSearch = '';

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.setupClientSearch();
    this.loadTechnicians();

    if (this.mantenimientoFijo) {
      this.isEditMode = true;
      this.form.patchValue(this.mantenimientoFijo);
      
      // If we have an elevator, we should try to pre-load the client
      if (this.mantenimientoFijo.ascensor) {
        this.selectedClient = this.mantenimientoFijo.ascensor.cliente;
        if (this.selectedClient) {
          this.loadElevatorsForClient(this.selectedClient.cliente_id);
        }
      }
    }
  }

  setupClientSearch(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 3) return of({ data: [] });
        this.isSearchingClients = true;
        return this.clientService.getClientsPaginated(1, 10, term).pipe(
          finalize(() => this.isSearchingClients = false)
        );
      })
    ).subscribe({
      next: (response: any) => {
        this.foundClients = response.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  onClientSearchUpdate(term: string): void {
    this.searchSubject.next(term);
  }

  selectClient(client: any): void {
    this.selectedClient = client;
    this.clientSearch = client.nombre_comercial || client.contacto_nombre;
    this.foundClients = [];
    this.ascensores = [];
    this.form.get('ascensor_id')?.setValue(null);
    this.loadElevatorsForClient(client.cliente_id);
  }

  clearClient(): void {
    this.selectedClient = null;
    this.clientSearch = '';
    this.ascensores = [];
    this.form.get('ascensor_id')?.setValue(null);
  }

  loadTechnicians(): void {
    this.technicianService.getTechnicians().subscribe({
      next: (data: any[]) => {
        this.trabajadores = data;
        this.cdr.detectChanges();
      }
    });
  }

  loadElevatorsForClient(clientId: number): void {
    this.isLoading = true;
    this.elevatorService.getElevators(clientId).subscribe({
      next: (data: any[]) => {
        this.ascensores = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => this.isLoading = false
    });
  }

  get filteredTrabajadores() {
    if (!this.techSearch) return this.trabajadores;
    const term = this.techSearch.toLowerCase();
    return this.trabajadores.filter(t => 
      (t.nombre || '').toLowerCase().includes(term) || (t.apellido || '').toLowerCase().includes(term)
    );
  }

  get filteredAscensores() {
    return this.ascensores;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const data = this.form.value;

    if (this.isEditMode && this.mantenimientoFijo) {
      this.maintenanceService.actualizar(this.mantenimientoFijo.mantenimiento_fijo_id, data).subscribe({
        next: () => {
          this.isSaving = false;
          this.saved.emit();
        },
        error: (err) => {
          this.errorMessage = err.message;
          this.isSaving = false;
        }
      });
    } else {
      this.maintenanceService.crear(data).subscribe({
        next: () => {
          this.isSaving = false;
          this.saved.emit();
        },
        error: (err) => {
          this.errorMessage = err.message;
          this.isSaving = false;
        }
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
