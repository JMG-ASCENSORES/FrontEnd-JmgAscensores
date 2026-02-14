import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElevatorService } from '../../services/elevator.service';
import { ClientService, Client } from '../../services/client.service';
import { Elevator } from '../../../../core/models/elevator.model';

@Component({
  selector: 'app-elevator-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
