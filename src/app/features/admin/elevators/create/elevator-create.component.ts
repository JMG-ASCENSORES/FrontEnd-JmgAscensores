import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElevatorService } from '../../services/elevator.service';
import { ClientService, Client } from '../../services/client.service';
import { Elevator } from '../../../../core/models/elevator.model';

@Component({
  selector: 'app-elevator-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './elevator-create.component.html',
  styleUrl: './elevator-create.component.scss'
})
export class ElevatorCreateComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() elevatorCreated = new EventEmitter<void>();

  private elevatorService = inject(ElevatorService);
  private clientService = inject(ClientService);

  clients = signal<Client[]>([]);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  equipmentTypes = ['Ascensor', 'Montacarga', 'Plataforma', 'Escalera Mecánica'];
  statuses = ['Operativo', 'En Mantenimiento', 'Fuera de Servicio', 'En Revisión'];

  formData: Partial<Elevator> = {
    tipo_equipo: 'Ascensor',
    estado: 'Operativo',
    piso_cantidad: 1
  };

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.clientService.getClients().subscribe({
      next: (data) => this.clients.set(data),
      error: (err) => console.error('Error loading clients for dropdown', err)
    });
  }

  onSubmit() {
    if (this.isSubmitting()) return;

    // Validación Regex
    const saneRegex = /^[\w\-\s]+$/; // Alfanuméricos, guiones y espacios
    if (!this.formData.numero_serie || !saneRegex.test(this.formData.numero_serie)) {
      this.error.set('El número de serie es obligatorio y solo puede contener letras, números y guiones.');
      return;
    }
    const strictContentRegex = /^[^<>]*$/; // Anti-XSS tags limitados
    if (this.formData.marca && !strictContentRegex.test(this.formData.marca)) {
      this.error.set('La marca contiene caracteres inválidos (< >).');
      return;
    }
    if (this.formData.modelo && !strictContentRegex.test(this.formData.modelo)) {
      this.error.set('El modelo contiene caracteres inválidos (< >).');
      return;
    }
    if (this.formData.capacidad_kg !== undefined && this.formData.capacidad_kg !== null && this.formData.capacidad_kg < 0) {
      this.error.set('La capacidad en KG no puede ser negativa.');
      return;
    }
    if (this.formData.capacidad_personas !== undefined && this.formData.capacidad_personas !== null && this.formData.capacidad_personas < 0) {
      this.error.set('La capacidad en personas no puede ser negativa.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    this.elevatorService.createElevator(this.formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.elevatorCreated.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(err.message || 'Error al crear el equipo.');
      }
    });
  }
}
