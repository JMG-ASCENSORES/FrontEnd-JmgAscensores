import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElevatorService, Elevator } from '../../services/elevator.service';
import { Client } from '../../services/client.service';
import { EquipmentCreateModalComponent } from './equipment-create-modal.component';
import { EquipmentEditModalComponent } from './equipment-edit-modal.component';
import { EquipmentDeleteModalComponent } from './equipment-delete-modal.component';

@Component({
  selector: 'app-equipment-list-modal',
  standalone: true,
  imports: [CommonModule, EquipmentCreateModalComponent, EquipmentEditModalComponent, EquipmentDeleteModalComponent],
  templateUrl: './equipment-list-modal.component.html',
})
export class EquipmentListModalComponent implements OnInit {
  @Input() client!: Client;
  @Input() equipmentType!: string; // 'Ascensor', 'Montacarga', 'Plataforma'
  @Output() close = new EventEmitter<void>();
  @Output() equipmentChanged = new EventEmitter<void>();

  private elevatorService = inject(ElevatorService);

  equipments = signal<Elevator[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  selectedEquipment = signal<Elevator | null>(null);

  ngOnInit() {
    this.loadEquipments();
  }

  loadEquipments() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.elevatorService.getElevators(this.client.cliente_id).subscribe({
      next: (data) => {
        // Filter by equipment type
        const filtered = data.filter(e => 
          e.tipo_equipo?.toLowerCase().includes(this.equipmentType.toLowerCase())
        );
        this.equipments.set(filtered);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Error al cargar equipos');
        this.isLoading.set(false);
      }
    });
  }

  onClose() {
    this.close.emit();
  }

  openCreateModal() {
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  onEquipmentCreated() {
    this.loadEquipments();
    this.equipmentChanged.emit();
    this.closeCreateModal();
  }

  openEditModal(equipment: Elevator) {
    this.selectedEquipment.set(equipment);
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedEquipment.set(null);
  }

  onEquipmentUpdated() {
    this.loadEquipments();
    this.equipmentChanged.emit();
    this.closeEditModal();
  }

  openDeleteModal(equipment: Elevator) {
    this.selectedEquipment.set(equipment);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedEquipment.set(null);
  }

  onEquipmentDeleted() {
    this.loadEquipments();
    this.equipmentChanged.emit();
    this.closeDeleteModal();
  }

  getEquipmentTypeLabel(): string {
    const labels: Record<string, string> = {
      'ascensor': 'Ascensores',
      'montacarga': 'Montacargas',
      'plataforma': 'Plataformas'
    };
    return labels[this.equipmentType.toLowerCase()] || 'Equipos';
  }
}
