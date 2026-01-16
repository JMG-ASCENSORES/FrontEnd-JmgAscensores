import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TechnicianService, Technician } from '../../services/technician.service';
import { TechnicianCreateComponent } from '../create/technician-create.component';
import { TechnicianEditComponent } from '../edit/technician-edit.component';

@Component({
  selector: 'app-technician-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TechnicianCreateComponent, TechnicianEditComponent],
  templateUrl: './technician-list.component.html',
  styleUrl: './technician-list.component.scss'
})
export class TechnicianListComponent implements OnInit {
  private technicianService = inject(TechnicianService);

  // Signals for state
  searchQuery = signal('');
  selectedSpecialty = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);
  showCreateModal = signal(false);
  
  // Edit State
  showEditModal = signal(false);
  selectedTechnician = signal<Technician | null>(null);

  specialties = [
    'Técnico General',
    'Técnico de Mantenimiento',
    'Supervisor Técnico',
    'Técnico de Reparaciones'
  ];

  // Data
  technicians = signal<Technician[]>([]);

  ngOnInit(): void {
    this.loadTechnicians();
  }

  loadTechnicians(): void {
    this.isLoading.set(true);
    this.error.set(null); // Reset error
    this.technicianService.getTechnicians().subscribe({
      next: (data) => {
        this.technicians.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading technicians', err);
        if (err.status === 403) {
          this.error.set('Acceso Denegado: No tienes permisos de Administrador para ver esta sección.');
        } else {
          this.error.set('Error al cargar los técnicos. Por favor verifica tu conexión o inicia sesión nuevamente.');
        }
        this.isLoading.set(false);
      }
    });
  }

  // Computed Values
  filteredTechnicians = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const specialty = this.selectedSpecialty();
    
    return this.technicians().filter(tech => {
      const fullName = `${tech.nombre} ${tech.apellido}`.toLowerCase();
      const matchesSearch = fullName.includes(query) || tech.dni.includes(query);
      const matchesSpecialty = specialty ? tech.especialidad === specialty : true;
      return matchesSearch && matchesSpecialty;
    });
  });

  // Stats
  totalTechnicians = computed(() => this.technicians().length);
  
  maintenanceCount = computed(() => 
    this.technicians().filter(t => t.especialidad === 'Técnico de Mantenimiento').length
  );
  
  generalCount = computed(() => 
    this.technicians().filter(t => t.especialidad === 'Técnico General').length
  );
  
  repairsCount = computed(() => 
    this.technicians().filter(t => t.especialidad === 'Técnico de Reparaciones').length
  );
  
  supervisorCount = computed(() => 
    this.technicians().filter(t => t.especialidad === 'Supervisor Técnico').length
  );


  // Helpers
  getInitials(nombre: string, apellido: string): string {
    return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
  }

  getSpecialtyColor(specialty: string): string {
    switch (specialty) {
      case 'Técnico General': return 'bg-emerald-100 text-emerald-700';
      case 'Técnico de Mantenimiento': return 'bg-blue-100 text-blue-700';
      case 'Supervisor Técnico': return 'bg-purple-100 text-purple-700';
      case 'Técnico de Reparaciones': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  openCreateModal() {
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  onTechnicianCreated() {
    this.loadTechnicians(); // Refresh list
    // Optional: Show success toast/notification
  }

  openEditModal(technician: Technician) {
    this.selectedTechnician.set(technician);
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedTechnician.set(null);
  }

  onTechnicianUpdated() {
    this.loadTechnicians();
  }
}
