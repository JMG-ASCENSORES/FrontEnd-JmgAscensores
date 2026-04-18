import { LucideAngularModule } from 'lucide-angular';
import { Component, OnInit, Input, Output, EventEmitter, inject, ChangeDetectorRef, SimpleChanges, OnChanges } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MantenimientoService } from '../services/mantenimiento.service';
import { Mantenimiento, CrearMantenimientoDTO } from '../models/mantenimiento.interface';
import { TechnicianService } from '../services/technician.service';
import { ClientService } from '../services/client.service';
import { ElevatorService } from '../services/elevator.service';

interface Trabajador {
  usuario_id: number;
  nombre: string;
  apellido: string;
  email: string;
  especialidad?: string;
}

interface Cliente {
  cliente_id: number;
  nombre_comercial?: string;
  contacto_nombre?: string;
  contacto_apellido?: string;
  tipo_cliente?: string;
}

interface Ascensor {
  ascensor_id: number;
  cliente_id: number;
  tipo_equipo: string;
  marca: string;
  modelo?: string;
  numero_serie?: string;
  estado?: string;
}

@Component({
  selector: 'app-programacion-modal',
  standalone: true,
  imports: [FormsModule,
    LucideAngularModule
  ],
  templateUrl: './programacion-modal.component.html',
  styleUrls: ['./programacion-modal.component.css']
})
export class ProgramacionModalComponent implements OnInit, OnChanges {
  @Input() mantenimiento: Mantenimiento | null = null;
  @Input() date: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private mantenimientoService = inject(MantenimientoService);
  private technicianService = inject(TechnicianService);
  private clientService = inject(ClientService);
  private elevatorService = inject(ElevatorService);
  private cdr = inject(ChangeDetectorRef);

  // Form data
  formData = {
    titulo: '',
    fecha: '',
    hora_inicio: '09:00',
    hora_fin: '10:00',
    trabajador_ids: [] as number[],   // hasta 4 técnicos
    cliente_id: 0,
    ascensor_id: 0,
    tipo_trabajo: 'mantenimiento',
    descripcion: ''
  };

  // Dropdowns data
  trabajadores: Trabajador[] = [];
  clientes: Cliente[] = [];
  ascensores: Ascensor[] = [];
  ascensoresFiltered: Ascensor[] = [];
  
  // Search state
  techSearch: string = '';
  clientSearch: string = '';

  tipoTrabajoOptions = [
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'reparacion',    label: 'Reparación'    },
    { value: 'inspeccion',   label: 'Inspección'    },
    { value: 'emergencia',   label: 'Emergencia'    }
  ];

  isLoading   = false;
  isSaving    = false;
  errorMessage = '';
  validationErrors: { [key: string]: string } = {};
  isEditMode  = false;

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDropdownData();
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mantenimiento'] || changes['date']) {
      this.initForm();
    }
  }

  // ─── Multi-select técnicos ────────────────────────────────────────────────────
  isTrabajadorSelected(id: number): boolean {
    // Coerce to Number to avoid type mismatch (JSON may return strings)
    const numId = Number(id);
    return this.formData.trabajador_ids.some(t => Number(t) === numId);
  }

  toggleTrabajador(id: number): void {
    const numId = Number(id);
    const exists = this.formData.trabajador_ids.some(t => Number(t) === numId);
    if (exists) {
      this.formData.trabajador_ids = this.formData.trabajador_ids.filter(t => Number(t) !== numId);
    } else if (this.formData.trabajador_ids.length < 4) {
      this.formData.trabajador_ids = [...this.formData.trabajador_ids, numId];
    }
    this.cdr.detectChanges();
  }

  get maxTecnicosAlcanzado(): boolean {
    return this.formData.trabajador_ids.length >= 4;
  }

  // ─── Form Init ───────────────────────────────────────────────────────────────
  initForm(): void {
    if (this.mantenimiento) {
      this.isEditMode = true;
      this.populateForm();
    } else {
      this.isEditMode = false;
      const today = new Date();
      this.formData = {
        titulo: '',
        fecha: this.date || today.toISOString().split('T')[0],
        hora_inicio: '09:00',
        hora_fin: '10:00',
        trabajador_ids: [],
        cliente_id: 0,
        ascensor_id: 0,
        tipo_trabajo: 'mantenimiento',
        descripcion: ''
      };
      this.ascensoresFiltered = [];
      this.techSearch = '';
      this.clientSearch = '';
    }
  }

  // ─── Load Dropdowns ──────────────────────────────────────────────────────────
  loadDropdownData(): void {
    this.isLoading = true;

    this.technicianService.getTechnicians().subscribe({
      next: (data) => {
        this.trabajadores = data.map((tech: any) => ({
          usuario_id:  tech.id,
          nombre:      tech.nombre,
          apellido:    tech.apellido,
          email:       tech.correo,
          especialidad: tech.especialidad
        }));
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading technicians:', err)
    });

    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clientes = data.map((client: any) => ({
          cliente_id:        client.cliente_id,
          nombre_comercial:  client.nombre_comercial,
          contacto_nombre:   client.contacto_nombre,
          contacto_apellido: client.contacto_apellido,
          tipo_cliente:      client.tipo_cliente
        }));
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading clients:', err)
    });

    this.elevatorService.getElevators().subscribe({
      next: (data) => {
        this.ascensores = data.map((elev: any) => ({
          ascensor_id:  elev.ascensor_id,
          cliente_id:   elev.cliente_id,
          tipo_equipo:  elev.tipo_equipo,
          marca:        elev.marca || '',
          modelo:       elev.modelo,
          numero_serie: elev.numero_serie || '',
          estado:       elev.estado
        }));
        this.isLoading = false;

        // En modo edición, filtrar ascensores una vez que carguen
        if (this.isEditMode && this.formData.cliente_id) {
          this.onClienteChange();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading elevators:', err);
        this.isLoading = false;
      }
    });
  }

  // ─── Populate form (edit mode) ───────────────────────────────────────────────
  populateForm(): void {
    if (!this.mantenimiento) return;

    const fechaInicio = new Date(this.mantenimiento.start);
    const fechaFin    = new Date(this.mantenimiento.end);

    // Construir array de IDs desde las 4 columnas explícitas del backend
    // El backend devuelve: trabaj_ids[], tecnico2_id, tecnico3_id, tecnico4_id, trabajador_id
    const ext = this.mantenimiento.extendedProps;
    let ids: number[] = [];

    // Opción 1: trabajador_ids[] ya viene calculado desde el controller
    if (ext?.trabajador_ids?.length) {
      ids = ext.trabajador_ids.map((id: any) => Number(id)).filter((n: number) => n > 0);
    }
    // Opción 2: reconstruir desde las columnas explícitas
    else {
      [ext?.trabajador_id, ext?.tecnico2_id, ext?.tecnico3_id, ext?.tecnico4_id]
        .forEach((id: any) => { if (id) ids.push(Number(id)); });
    }
    // Opción 3: usar objetos Trabajador devueltos
    if (ids.length === 0 && ext?.trabajadores?.length) {
      ids = ext.trabajadores.map((w: any) => Number(w.trabajador_id)).filter((n: number) => n > 0);
    }

    this.formData = {
      titulo:         this.mantenimiento.title,
      fecha:          fechaInicio.toISOString().split('T')[0],
      hora_inicio:    fechaInicio.toTimeString().substring(0, 5),
      hora_fin:       fechaFin.toTimeString().substring(0, 5),
      trabajador_ids: ids,
      cliente_id:     ext?.cliente_id  || 0,
      ascensor_id:    ext?.ascensor_id || 0,
      tipo_trabajo:   ext?.tipo_trabajo || 'mantenimiento',
      descripcion:    ext?.descripcion  || ''
    };

    // Los ascensores se filtrarán en el callback de getElevators()
  }

  // ─── Cliente change → filtrar ascensores ─────────────────────────────────────
  onClienteChange(): void {
    const clienteId = Number(this.formData.cliente_id);
    if (clienteId && clienteId > 0) {
      this.ascensoresFiltered = this.ascensores.filter(asc => asc.cliente_id === clienteId);
      const existe = this.ascensoresFiltered.find(a => a.ascensor_id === this.formData.ascensor_id);
      if (!existe) this.formData.ascensor_id = 0;
    } else {
      this.ascensoresFiltered = [];
      this.formData.ascensor_id = 0;
    }
  }
  
  // ─── Filtrado de búsquedas ───────────────────────────────────────────────────
  get filteredTrabajadores(): Trabajador[] {
    if (!this.techSearch.trim()) return this.trabajadores;
    const term = this.techSearch.toLowerCase().trim();
    return this.trabajadores.filter(t => 
      t.nombre.toLowerCase().includes(term) || 
      t.apellido.toLowerCase().includes(term) ||
      (t.especialidad && t.especialidad.toLowerCase().includes(term))
    );
  }

  get filteredClientes(): Cliente[] {
    if (!this.clientSearch.trim()) return this.clientes;
    const term = this.clientSearch.toLowerCase().trim();
    return this.clientes.filter(c => 
      (c.nombre_comercial && c.nombre_comercial.toLowerCase().includes(term)) ||
      (c.contacto_nombre && c.contacto_nombre.toLowerCase().includes(term)) ||
      (c.contacto_apellido && c.contacto_apellido.toLowerCase().includes(term))
    );
  }

  // ─── Validación ──────────────────────────────────────────────────────────────
  validateForm(): boolean {
    this.validationErrors = {};
    let isValid = true;

    if (!this.formData.titulo.trim()) {
      this.validationErrors['titulo'] = 'El título es requerido';
      isValid = false;
    }
    if (!this.formData.fecha) {
      this.validationErrors['fecha'] = 'La fecha es requerida';
      isValid = false;
    }
    if (!this.formData.hora_inicio) {
      this.validationErrors['hora_inicio'] = 'La hora de inicio es requerida';
      isValid = false;
    }
    if (!this.formData.hora_fin) {
      this.validationErrors['hora_fin'] = 'La hora de fin es requerida';
      isValid = false;
    }
    if (this.formData.trabajador_ids.length === 0) {
      this.validationErrors['trabajador_ids'] = 'Debe asignar al menos un técnico';
      isValid = false;
    }
    if (!this.formData.ascensor_id || this.formData.ascensor_id === 0) {
      this.validationErrors['ascensor_id'] = 'Debe seleccionar un equipo (ascensor)';
      isValid = false;
    }

    // Validación de horas lógicas cruzadas
    const startStr = `${this.formData.fecha}T${this.formData.hora_inicio}`;
    const endStr = `${this.formData.fecha}T${this.formData.hora_fin}`;
    if (new Date(startStr) >= new Date(endStr)) {
      this.validationErrors['hora_fin'] = 'La hora de fin debe ser posterior a la de inicio';
      isValid = false;
    }

    // Sanitización básica Regex
    const saneRegex = /^[^<>]*$/; // Previene tags HTML básicos
    if (this.formData.titulo && !saneRegex.test(this.formData.titulo)) {
      this.validationErrors['titulo'] = 'El título contiene caracteres inválidos (< >)';
      isValid = false;
    }
    if (this.formData.descripcion && !saneRegex.test(this.formData.descripcion)) {
      this.validationErrors['descripcion'] = 'La descripción contiene caracteres inválidos (< >)';
      isValid = false;
    }

    return isValid;
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (!this.validateForm()) {
      this.errorMessage = 'Por favor, verifique y complete todos los campos obligatorios en rojo.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const data: CrearMantenimientoDTO = {
      titulo:               this.formData.titulo.trim(),
      fecha_programada:     this.formData.fecha,
      hora_estimada_inicio: this.formData.hora_inicio,
      hora_estimada_fin:    this.formData.hora_fin,
      trabajador_ids:       this.formData.trabajador_ids,
      tipo_trabajo:         this.formData.tipo_trabajo,
      descripcion:          this.formData.descripcion?.trim() || undefined,
      cliente_id:           this.formData.cliente_id,
      ascensor_id:          this.formData.ascensor_id
    };

    const handleError = (err: any) => {
      console.error('Error saving mantenimiento:', err);
      let msg = 'Ocurrió un error inesperado al guardar la programación.';
      
      if (err.error) {
        if (err.error.message) {
          msg = err.error.message;
        } else if (typeof err.error === 'string') {
          msg = err.error;
        }

        if (err.error.errors) {
          const errors = err.error.errors;
          if (Array.isArray(errors)) {
            msg += `: ${errors.join(', ')}`;
          } else if (typeof errors === 'object') {
            const detailedErrors = Object.values(errors).flat().join(', ');
            msg += `: ${detailedErrors}`;
          }
        }
      } else if (err.message) {
        msg = err.message;
      }
      
      this.errorMessage = msg;
      this.isSaving = false;
      this.cdr.detectChanges();
    };

    if (this.isEditMode && this.mantenimiento) {
      this.mantenimientoService.actualizar(this.mantenimiento.id, data).subscribe({
        next: () => { this.isSaving = false; this.saved.emit(); },
        error: handleError
      });
    } else {
      this.mantenimientoService.crear(data).subscribe({
        next: () => { this.isSaving = false; this.saved.emit(); },
        error: handleError
      });
    }
  }

  // ─── Close ───────────────────────────────────────────────────────────────────
  onClose(): void {
    this.close.emit();
  }

  // ─── Helpers UI ──────────────────────────────────────────────────────────────
  getClienteNombre(cliente: Cliente | undefined): string {
    if (!cliente) return '';
    return cliente.nombre_comercial ||
      `${cliente.contacto_nombre || ''} ${cliente.contacto_apellido || ''}`.trim();
  }

  getAscensorLabel(ascensor: Ascensor | undefined): string {
    if (!ascensor) return '';
    return `${ascensor.tipo_equipo} - ${ascensor.marca} ${ascensor.modelo || ''}`.trim();
  }
}
