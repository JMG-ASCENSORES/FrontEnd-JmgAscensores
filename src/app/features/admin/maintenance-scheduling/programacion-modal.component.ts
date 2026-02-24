import { Component, OnInit, Input, Output, EventEmitter, inject, ChangeDetectorRef, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  MantenimientoService 
} from '../services/mantenimiento.service';
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
  imports: [CommonModule, FormsModule],
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
    hora_inicio: '',
    hora_fin: '',
    trabajador_id: 0,
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

  // Tipo de trabajo options
  tipoTrabajoOptions: { value: string; label: string }[] = [
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'reparacion', label: 'Reparación' },
    { value: 'inspeccion', label: 'Inspección' },
    { value: 'emergencia', label: 'Emergencia' }
  ];

  // State
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  validationErrors: { [key: string]: string } = {};

  isEditMode = false;

  ngOnInit(): void {
    this.loadDropdownData();
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mantenimiento'] || changes['date']) {
      this.initForm();
    }
  }

  initForm(): void {
    if (this.mantenimiento) {
      this.isEditMode = true;
      this.populateForm();
    } else {
      this.isEditMode = false;
      // Set default date
      if (this.date) {
        this.formData.fecha = this.date;
      } else {
        const today = new Date();
        this.formData.fecha = today.toISOString().split('T')[0];
      }
      
      // Reset other fields
      this.formData.titulo = '';
      this.formData.hora_inicio = '09:00';
      this.formData.hora_fin = '10:00';
      this.formData.trabajador_id = 0;
      this.formData.cliente_id = 0;
      this.formData.ascensor_id = 0;
      this.formData.tipo_trabajo = 'mantenimiento';
      this.formData.descripcion = '';
      this.ascensoresFiltered = [];
    }
  }

  loadDropdownData(): void {
    this.isLoading = true;

    // Load trabajadores (técnicos)
    this.technicianService.getTechnicians().subscribe({
      next: (data) => {
        this.trabajadores = data.map(tech => ({
          usuario_id: tech.id,
          nombre: tech.nombre,
          apellido: tech.apellido,
          email: tech.correo,
          especialidad: tech.especialidad
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading technicians:', err);
      }
    });

    // Load clientes
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clientes = data.map(client => ({
          cliente_id: client.cliente_id,
          nombre_comercial: client.nombre_comercial,
          contacto_nombre: client.contacto_nombre,
          contacto_apellido: client.contacto_apellido,
          tipo_cliente: client.tipo_cliente
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading clients:', err);
      }
    });

    // Load all ascensores
    this.elevatorService.getElevators().subscribe({
      next: (data) => {
        console.log('Ascensores loaded:', data);
        this.ascensores = data.map(elev => ({
          ascensor_id: elev.ascensor_id,
          cliente_id: elev.cliente_id,
          tipo_equipo: elev.tipo_equipo,
          marca: elev.marca || '',
          modelo: elev.modelo,
          numero_serie: elev.numero_serie || '',
          estado: elev.estado
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading elevators:', err);
        this.isLoading = false;
      }
    });
  }

  populateForm(): void {
    if (!this.mantenimiento) return;

    const fechaInicio = new Date(this.mantenimiento.start);
    const fechaFin = new Date(this.mantenimiento.end);

    this.formData = {
      titulo: this.mantenimiento.title,
      fecha: fechaInicio.toISOString().split('T')[0],
      hora_inicio: fechaInicio.toTimeString().substring(0, 5),
      hora_fin: fechaFin.toTimeString().substring(0, 5),
      trabajador_id: this.mantenimiento.extendedProps?.trabajador_id || 0,
      cliente_id: this.mantenimiento.extendedProps?.cliente_id || 0,
      ascensor_id: this.mantenimiento.extendedProps?.ascensor_id || 0,
      tipo_trabajo: this.mantenimiento.extendedProps?.tipo_trabajo || 'mantenimiento',
      descripcion: this.mantenimiento.extendedProps?.descripcion || ''
    };

    // Filter ascensores if cliente is selected
    if (this.formData.cliente_id) {
      this.onClienteChange();
    }
  }

  onClienteChange(): void {
    const clienteId = Number(this.formData.cliente_id);
    
    if (clienteId && clienteId > 0) {
      console.log('Filtering elevators for client:', clienteId);
      this.ascensoresFiltered = this.ascensores.filter(
        asc => asc.cliente_id === clienteId
      );
      console.log('Filtered elevators:', this.ascensoresFiltered);
      
      // Reset ascensor if it doesn't belong to selected client
      if (this.formData.ascensor_id) {
        const ascensorExists = this.ascensoresFiltered.find(
          asc => asc.ascensor_id === this.formData.ascensor_id
        );
        if (!ascensorExists) {
          this.formData.ascensor_id = 0;
        }
      }
    } else {
      this.ascensoresFiltered = [];
      this.formData.ascensor_id = 0;
    }
  }

  validateForm(): boolean {
    this.validationErrors = {};
    let isValid = true;

    // Título requerido
    if (!this.formData.titulo.trim()) {
      this.validationErrors['titulo'] = 'El título es requerido';
      isValid = false;
    }

    // Fecha requerida
    if (!this.formData.fecha) {
      this.validationErrors['fecha'] = 'La fecha es requerida';
      isValid = false;
    }

    // Hora inicio requerida
    if (!this.formData.hora_inicio) {
      this.validationErrors['hora_inicio'] = 'La hora de inicio es requerida';
      isValid = false;
    }

    // Hora fin requerida
    if (!this.formData.hora_fin) {
      this.validationErrors['hora_fin'] = 'La hora de fin es requerida';
      isValid = false;
    }

    // Hora fin > Hora inicio
    if (this.formData.hora_inicio && this.formData.hora_fin) {
      if (this.formData.hora_fin <= this.formData.hora_inicio) {
        this.validationErrors['hora_fin'] = 'La hora de fin debe ser mayor a la hora de inicio';
        isValid = false;
      }
    }

    // Trabajador requerido (Opcional según lógica anterior, pero mejor validar si se pide integridad)
    // El usuario no lo pidió explícitamente pero es buenas práctica. Dejaré como estaba si no pidió cambios aquí.

    // Cliente requerido para seleccionar equipo
    if (!this.formData.cliente_id || this.formData.cliente_id === 0) {
       // Si el equipo es obligatorio, el cliente también debe serlo implícitamente
       // Pero validaremos el equipo directamente abajo
    }

    // Equipo (Ascensor) Requerido - NUEVO REQUISITO
    if (!this.formData.ascensor_id || this.formData.ascensor_id === 0) {
      this.validationErrors['ascensor_id'] = 'Debe seleccionar un equipo (ascensor)';
      isValid = false;
    }

    return isValid;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const data: CrearMantenimientoDTO = {
      titulo: this.formData.titulo.trim(),
      fecha_programada: this.formData.fecha,
      hora_estimada_inicio: this.formData.hora_inicio,
      hora_estimada_fin: this.formData.hora_fin,
      trabajador_id: this.formData.trabajador_id || undefined,
      tipo_trabajo: this.formData.tipo_trabajo,
      descripcion: this.formData.descripcion.trim() || undefined,
      // Mandatory fields now
      cliente_id: this.formData.cliente_id,
      ascensor_id: this.formData.ascensor_id
    };

    if (this.isEditMode && this.mantenimiento) {
      // Update
      this.mantenimientoService.actualizar(this.mantenimiento.id, data).subscribe({
        next: () => {
          this.isSaving = false;
          this.saved.emit();
        },
        error: (err) => {
          console.error('Error updating mantenimiento:', err);
          this.errorMessage = err.message || 'Error al actualizar el mantenimiento';
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create
      this.mantenimientoService.crear(data).subscribe({
        next: () => {
          this.isSaving = false;
          this.saved.emit();
        },
        error: (err) => {
          console.error('Error creating mantenimiento:', err);
          this.errorMessage = err.message || 'Error al crear el mantenimiento';
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }

  getClienteNombre(cliente: Cliente): string {
    return cliente.nombre_comercial || 
           `${cliente.contacto_nombre || ''} ${cliente.contacto_apellido || ''}`.trim() ||
           'Sin nombre';
  }

  getAscensorLabel(ascensor: Ascensor): string {
    return `${ascensor.tipo_equipo} - ${ascensor.marca} ${ascensor.modelo || ''}`.trim();
  }
}
