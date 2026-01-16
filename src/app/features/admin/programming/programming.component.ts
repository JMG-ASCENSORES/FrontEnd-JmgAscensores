import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Import RouterModule for routerLink
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TechnicianService, Technician } from '../services/technician.service';

interface Worker {
  id: number;
  name: string;
  role: string;
  roleColor: string; // For the icon background
  icon: string;
}

interface Schedule {
  id: number;
  clientName: string;
  type: string;
  technicianName: string;
  time: string;
  address: string;
  avatarColor: string; // Tailwind class for circle
}

interface TimelineItem {
  date: string;
  description: string;
  completed: boolean;
}

@Component({
  selector: 'app-programming',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, RouterModule],
  templateUrl: './programming.component.html',
  styleUrls: ['./programming.component.css']
})
export class ProgrammingComponent implements OnInit {
  private technicianService = inject(TechnicianService);
  private cdr = inject(ChangeDetectorRef);
  
  currentDate = new Date();
  
  // Mock Data
  clientCount = 78;
  equipmentCount = 106;

  workers: Worker[] = [];
  isLoading = true;

  // ... (keeping schedules and timeline as they are in file, but we can't match them easily if we replace the whole block. Better to replace just the methods)

  schedules: Schedule[] = [
    { id: 1, clientName: 'Cliente - 1', type: 'Mantenimiento', technicianName: 'Técnico asignado', time: '08:00 AM', address: 'Dirección', avatarColor: 'bg-yellow-400' },
    { id: 2, clientName: 'Cliente - 2', type: 'Mantenimiento', technicianName: 'Técnico asignado', time: '10:00 AM', address: 'Dirección', avatarColor: 'bg-red-400' },
    { id: 3, clientName: 'Cliente - 3', type: 'Mantenimiento', technicianName: 'Técnico asignado', time: '12:00 PM', address: 'Dirección', avatarColor: 'bg-blue-400' },
    { id: 4, clientName: 'Cliente - 3', type: 'Mantenimiento', technicianName: 'Técnico asignado', time: '02:00 PM', address: 'Dirección', avatarColor: 'bg-green-400' }
  ];

  timeline: TimelineItem[] = [
    { date: '17 Nov 2025', description: 'Detalle del trabajo a realizar', completed: true },
    { date: '17 Nov 2025', description: 'Detalle del trabajo a realizar', completed: true },
    { date: '17 Nov 2025', description: 'Detalle del trabajo a realizar', completed: true },
    { date: '17 Nov 2025', description: 'Informe del Trabajo', completed: true }
  ];

  upcoming: any[] = [
    { date: '30 Nov 2021', type: 'Mantenimiento', alert: false },
    { date: '01 Dic 2025', type: 'Mantenimiento', alert: true },
    { date: '02 Dic 2025', type: 'Trabajo de Reparación', alert: false },
  ];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'title',
      center: '',
      right: 'prev,next'
    },
    initialDate: '2025-10-01',
    contentHeight: 'auto',
    locale: 'es', 
    firstDay: 0, // Sunday
    fixedWeekCount: false, // Hide extra rows if not needed
    showNonCurrentDates: true, // Show next/prev month dates (opaque)
    
    dayHeaderContent: (arg) => {
        const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        return days[arg.date.getDay()];
    },
    
    // We remove the standard 'events' array because we are styling the cells directly 
    // based on logic to match the "blue rounded square" design.
    // In a real app, you would check if a date has events here.
    
    dayCellClassNames: (arg) => {
        const dateStr = arg.date.toISOString().split('T')[0];
        
        // Simulation of dates with events
        const blueDays = ['2025-10-07', '2025-10-14', '2025-10-21', '2025-10-28', '2025-10-30', '2025-10-02', '2025-10-16', '2025-10-09', '2025-10-23']; 
        // Logic to highlight days
        if (blueDays.includes(dateStr)) {
            return ['blue-day'];
        }
        
        return [];
    }
  };

  constructor() {}

  ngOnInit(): void {
    this.loadWorkers();
  }

  loadWorkers() {
    this.isLoading = true;
    console.log('Loading workers...');
    // Removed filter to ensure we get data if any exists (even if inactive)
    this.technicianService.getTechnicians().subscribe({
      next: (data) => {
        console.log('Workers loaded:', data);
        // Take first 5 or so for the list
        this.workers = data.slice(0, 5).map(tech => ({
          id: tech.id,
          name: `${tech.nombre} ${tech.apellido}`,
          role: tech.especialidad,
          roleColor: this.getRoleColor(tech.especialidad),
          icon: this.getRoleIcon(tech.especialidad)
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading workers for summary', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getRoleColor(specialty: string): string {
    switch (specialty) {
      case 'Supervisor Técnico': return 'bg-purple-100 text-purple-600';
      case 'Técnico de Mantenimiento': return 'bg-teal-100 text-teal-600';
      case 'Técnico de Reparaciones': return 'bg-orange-100 text-orange-600';
      case 'Técnico General': return 'bg-blue-100 text-blue-600';     
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  getRoleIcon(specialty: string): string {
    switch (specialty) {
      case 'Supervisor Técnico': return 'bi-person-fill-gear';
      case 'Técnico de Mantenimiento': return 'bi-gear-wide-connected';
      case 'Técnico de Reparaciones': return 'bi-hammer';
      case 'Técnico General': return 'bi-person-badge';
      default: return 'bi-person';
    }
  }
}
