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
