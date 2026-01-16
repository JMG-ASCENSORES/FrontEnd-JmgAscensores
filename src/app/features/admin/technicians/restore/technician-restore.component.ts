import { Component, EventEmitter, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TechnicianService, Technician } from '../../services/technician.service';

@Component({
  selector: 'app-technician-restore',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './technician-restore.component.html',
  styleUrl: './technician-restore.component.scss'
})
export class TechnicianRestoreComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() technicianRestored = new EventEmitter<void>();

  private technicianService = inject(TechnicianService);

  // State
  inactiveTechnicians = signal<Technician[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Confirmation State
  confirmingId = signal<number | null>(null);
  isProcessing = signal(false);

  ngOnInit(): void {
    this.loadInactiveTechnicians();
  }

  loadInactiveTechnicians(): void {
    this.isLoading.set(true);
    this.technicianService.getTechnicians({ estado_activo: false }).subscribe({
      next: (data) => {
        this.inactiveTechnicians.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading inactive technicians', err);
        this.error.set('No se pudieron cargar los técnicos desactivados.');
        this.isLoading.set(false);
      }
    });
  }

  initiateRestore(id: number): void {
    this.confirmingId.set(id);
  }

  cancelRestore(): void {
    this.confirmingId.set(null);
  }

  confirmRestore(technician: Technician): void {
    this.isProcessing.set(true);
    
    // API call to reactivate (update estado_activo to true)
    this.technicianService.updateTechnician(technician.id, { estado_activo: true }).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.confirmingId.set(null);
        // Refresh local list
        this.loadInactiveTechnicians();
        // Notify parent to refresh main list
        this.technicianRestored.emit();
      },
      error: (err) => {
        console.error('Error restoring technician', err);
        this.isProcessing.set(false);
        // Could show a toast here
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
