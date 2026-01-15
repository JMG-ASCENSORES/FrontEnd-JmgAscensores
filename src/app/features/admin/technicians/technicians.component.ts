import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Technician {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  edad: number;
  correo: string;
  telefono: string;
  especialidad: 'Técnico General' | 'Técnico de Mantenimiento' | 'Supervisor Técnico' | 'Técnico de Reparaciones';
  foto?: string;
  estado_activo: boolean;
}

@Component({
  selector: 'app-technicians',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './technicians.component.html',
  styleUrl: './technicians.component.scss'
})
export class TechniciansComponent {
  // Signals for state
  searchQuery = signal('');
  selectedSpecialty = signal('');

  specialties = [
    'Técnico General',
    'Técnico de Mantenimiento',
    'Supervisor Técnico',
    'Técnico de Reparaciones'
  ];

  // Mock Data
  technicians = signal<Technician[]>([
    {
      id: 1,
      nombre: 'Juan',
      apellido: 'Pérez Ramírez',
      dni: '45678912',
      edad: 32,
      correo: 'jpramirez@gmail.com',
      telefono: '+51 987 654 321',
      especialidad: 'Técnico General',
      estado_activo: true,
      foto: ''
    },
    {
      id: 2,
      nombre: 'Carlos',
      apellido: 'Mendoza',
      dni: '71239485',
      edad: 28,
      correo: 'cmendoza@jmg.com',
      telefono: '+51 912 345 678',
      especialidad: 'Técnico de Mantenimiento',
      estado_activo: true
    },
    {
      id: 3,
      nombre: 'Roberto',
      apellido: 'Gómez',
      dni: '12345678',
      edad: 45,
      correo: 'rgomez@jmg.com',
      telefono: '+51 999 888 777',
      especialidad: 'Supervisor Técnico',
      estado_activo: true
    },
    {
      id: 4,
      nombre: 'Luis',
      apellido: 'Fernandez',
      dni: '87654321',
      edad: 30,
      correo: 'lfernandez@jmg.com',
      telefono: '+51 955 444 333',
      especialidad: 'Técnico de Reparaciones',
      estado_activo: true
    },
    {
      id: 5,
      nombre: 'Ana',
      apellido: 'Torres',
      dni: '15975346',
      edad: 29,
      correo: 'atorres@jmg.com',
      telefono: '+51 963 852 741',
      especialidad: 'Técnico General',
      estado_activo: true
    },
    {
      id: 6,
      nombre: 'Miguel',
      apellido: 'Ángel',
      dni: '95135782',
      edad: 35,
      correo: 'mangel@jmg.com',
      telefono: '+51 987 654 123',
      especialidad: 'Técnico de Mantenimiento',
      estado_activo: true
    },
    {
       id: 7,
       nombre: 'Pedro',
       apellido: 'Castillo',
       dni: '10293847',
       edad: 40,
       correo: 'pcastillo@jmg.com',
       telefono: '+51 928 374 651',
       especialidad: 'Técnico General',
       estado_activo: true
    },
    {
       id: 8,
       nombre: 'Sofía',
       apellido: 'Vergara',
       dni: '11223344',
       edad: 27,
       correo: 'svergara@jmg.com',
       telefono: '+51 901 234 567',
       especialidad: 'Técnico de Mantenimiento',
       estado_activo: true
    },
    {
       id: 9,
       nombre: 'Jorge',
       apellido: 'Chavez',
       dni: '99887766',
       edad: 33,
       correo: 'jchavez@jmg.com',
       telefono: '+51 911 222 333',
       especialidad: 'Técnico General',
       estado_activo: true
    },
    {
       id: 10,
       nombre: 'Mario',
       apellido: 'Vargas',
       dni: '44556677',
       edad: 38,
       correo: 'mvargas@jmg.com',
       telefono: '+51 944 555 666',
       especialidad: 'Técnico General',
       estado_activo: true
    },
    {
       id: 11,
       nombre: 'Lucia',
       apellido: 'Mendez',
       dni: '22334455',
       edad: 26,
       correo: 'lmendez@jmg.com',
       telefono: '+51 922 333 444',
       especialidad: 'Técnico General',
       estado_activo: true
    },
    {
       id: 12,
       nombre: 'Diego',
       apellido: 'Luna',
       dni: '66778899',
       edad: 31,
       correo: 'dluna@jmg.com',
       telefono: '+51 966 777 888',
       especialidad: 'Técnico de Reparaciones',
       estado_activo: true
    }
  ]);

  // Computed Values
  filteredTechnicians = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const specialty = this.selectedSpecialty();
    
    return this.technicians().filter(tech => {
      const matchesSearch = (tech.nombre + ' ' + tech.apellido + ' ' + tech.dni).toLowerCase().includes(query);
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

  openRequestModal() {
    console.log('Open modal to add technician');
    // To be implemented
  }
}
