import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

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
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './programming.component.html',
  styleUrls: ['./programming.component.css']
})
export class ProgrammingComponent {
  currentDate = new Date();
  
  // Mock Data
  clientCount = 78;
  equipmentCount = 106;

  workers: Worker[] = [
    { id: 1, name: 'Nombre del personal - 1', role: 'Supervisor Técnico', roleColor: 'bg-blue-100 text-blue-600', icon: 'bi-person-fill-gear' },
    { id: 2, name: 'Nombre del personal - 2', role: 'Personal Técnico', roleColor: 'bg-blue-100 text-blue-600', icon: 'bi-person-badge' },
    { id: 3, name: 'Nombre del personal - 3', role: 'Personal Técnico', roleColor: 'bg-blue-100 text-blue-600', icon: 'bi-person-badge' },
    { id: 4, name: 'Nombre del personal - 4', role: 'Técnico de Reparaciones', roleColor: 'bg-orange-100 text-orange-600', icon: 'bi-hammer' },
    { id: 5, name: 'Nombre del personal - 5', role: 'Técnico de mantenimientos', roleColor: 'bg-teal-100 text-teal-600', icon: 'bi-gear-wide-connected' },
    { id: 6, name: 'Nombre del personal - 6', role: 'Técnico de emergencias', roleColor: 'bg-red-100 text-red-600', icon: 'bi-medical-cross' },
  ];

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
}
