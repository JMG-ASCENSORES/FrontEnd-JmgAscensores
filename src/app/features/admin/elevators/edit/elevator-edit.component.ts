import { LucideAngularModule } from 'lucide-angular';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ElevatorService } from '../../services/elevator.service';
import { ClientService, Client } from '../../services/client.service';
import { Elevator } from '../../../../core/models/elevator.model';

@Component({
  selector: 'app-elevator-edit',
  standalone: true,
  imports: [FormsModule,
    LucideAngularModule
  ],
  templateUrl: './elevator-edit.component.html',
  styleUrl: './elevator-edit.component.scss'
})
export class ElevatorEditComponent implements OnInit {
  @Input() elevator!: Elevator;
  @Output() close = new EventEmitter<void>();
  @Output() elevatorUpdated = new EventEmitter<void>();

  private elevatorService = inject(ElevatorService);
  private clientService = inject(ClientService);

  clients = signal<Client[]>([]);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  equipmentTypes = ['Ascensor', 'Montacarga', 'Plataforma', 'Escalera Mecánica'];
  statuses = ['Operativo', 'En Mantenimiento', 'Fuera de Servicio', 'En Revisión'];

  formData: Partial<Elevator> = {};

  ngOnInit() {
    this.formData = { ...this.elevator };
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

    // Validación Regex Relaxed (permitir puntos, slashes y otros caracteres comunes en series)
    const saneRegex = /^[\w\-\s./#]+$/; 
    if (!this.formData.numero_serie || !saneRegex.test(this.formData.numero_serie)) {
      this.error.set('El número de serie es obligatorio y contiene caracteres no permitidos.');
      return;
    }
    const strictContentRegex = /^[^<>]*$/; 
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

    this.elevatorService.updateElevator(this.elevator.ascensor_id, this.formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.elevatorUpdated.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(err.message || 'Error al actualizar el equipo.');
      }
    });
  }
}
