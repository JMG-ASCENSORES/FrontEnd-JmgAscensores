import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Import RouterModule for routerLink
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TechnicianService, Technician } from '../services/technician.service';
import { MantenimientoService } from '../services/mantenimiento.service';
import { Mantenimiento } from '../models/mantenimiento.interface';

interface Worker {
  id: number;
  name: string;
  role: string;
  roleColor: string; // For the icon background
  icon: string;
  dni?: string;
}

interface Schedule {
  id: number;
  clientName: string;
  type: string;
  technicianName: string;
  time: string;
  address: string;
  avatarColor: string; // Tailwind class for circle
  originalData: Mantenimiento;
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
  styleUrls: ['./programming.component.css'],
  host: {
    class: 'flex-1 flex flex-col min-h-0'
  }
})
export class ProgrammingComponent implements OnInit {
  private technicianService = inject(TechnicianService);
  private mantenimientoService = inject(MantenimientoService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  currentDate = new Date();
  currentDateStr = (() => {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  })();
  
  // Mock Data
  clientCount = 78;
  equipmentCount = 106;

  workers: Worker[] = [];
  isLoading = true;

  allMantenimientos: Mantenimiento[] = [];
  schedules: Schedule[] = [];
  selectedSchedule: Schedule | null = null;
  
  firstJobClientName: string = 'Sin trabajos hoy';
  firstJobClientAddress: string = 'N/A';
  firstJobAvatarColor: string = 'bg-gray-400';
  timeline: TimelineItem[] = [];

  upcoming: any[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'title',
      center: '',
      right: 'prev,next'
    },
    contentHeight: 'auto',
    locale: 'es', 
    firstDay: 0, // Sunday
    fixedWeekCount: false, // Hide extra rows if not needed
    showNonCurrentDates: true, // Show next/prev month dates (opaque)
    
    dayHeaderContent: (arg) => {
        const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        return days[arg.date.getDay()];
    },
    
    dayCellClassNames: (arg) => {
        const d = arg.date;
        const localDateStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
        
        // Verifica si hay mantenimientos en este día
        const tieneSchedules = this.allMantenimientos.some(m => m.start.split('T')[0] === localDateStr);
        if (tieneSchedules) {
            return ['blue-day']; // Esta clase ya existe en CSS (blue rounded square)
        }
        
        return [];
    },
    
    dateClick: (info) => {
        this.router.navigate(['/admin/programation'], { queryParams: { date: info.dateStr } });
    }
  };

  constructor() {}

  ngOnInit(): void {
    this.loadWorkers();
    this.loadSchedules();
  }

  loadWorkers() {
    this.isLoading = true;
    this.technicianService.getTechnicians().subscribe({
      next: (data) => {
        // Ordenar primero (Jerarquía personalizada)
        const orderMap: Record<string, number> = {
            'Supervisor Técnico': 1,
            'Técnico de Mantenimiento': 2,
            'Técnico de Reparaciones': 3,
            'Técnico General': 4
        };
        
        const sortedData = data.sort((a, b) => {
            const orderA = orderMap[a.especialidad] || 99;
            const orderB = orderMap[b.especialidad] || 99;
            return orderA - orderB;
        });

        this.workers = sortedData.map(tech => ({
          id: tech.id,
          name: `${tech.nombre} ${tech.apellido}`,
          role: tech.especialidad,
          roleColor: this.getRoleColor(tech.especialidad),
          icon: this.getRoleIcon(tech.especialidad),
          dni: tech.dni
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

  goToTechnicianDetails(worker: Worker) {
      if (worker.dni) {
          // Pass the worker DNI as a query parameter so the technician list can auto-filter or know who to open
          this.router.navigate(['/admin/technicians'], { queryParams: { search: worker.dni }});
      }
  }

  selectSchedule(schedule: Schedule) {
      this.selectedSchedule = schedule;
      this.updateDetailView(schedule);
  }

  loadSchedules() {
      // Get all recent/future schedules
      this.mantenimientoService.listar().subscribe({
          next: (data) => {
              this.allMantenimientos = data;
              this.processSchedules();
              // Update calendar trick to trigger re-render of day cells
              this.calendarOptions = { ...this.calendarOptions };
              this.cdr.detectChanges();
          },
          error: (err) => {
              console.error('Error loading schedules', err);
          }
      });
  }
  
  processSchedules() {
      const todayStr = this.currentDateStr;
      
      // 1. "Programaciones del día"
      // Filter the ones matching today
      const todayMantenimientos = this.allMantenimientos.filter(m => m.start.startsWith(todayStr));
      
      const avatarColors = ['bg-yellow-400', 'bg-red-400', 'bg-blue-400', 'bg-green-400'];
      
      this.schedules = todayMantenimientos.map((m, index) => {
          let clientName = 'Sin Cliente';
          let address = 'Sin dirección';
          if (m.extendedProps?.cliente) {
              clientName = m.extendedProps.cliente.nombre_comercial || `${m.extendedProps.cliente.contacto_nombre || ''} ${m.extendedProps.cliente.contacto_apellido || ''}`.trim() || 'Sin Cliente';
          }
          if (m.extendedProps?.ascensor && m.extendedProps.ascensor.modelo) {
              address = `Ascensor: ${m.extendedProps.ascensor.marca} ${m.extendedProps.ascensor.modelo}`;
          }
          
          let techName = 'No asignado';
          if (m.extendedProps?.trabajadores && m.extendedProps.trabajadores.length > 0) {
              const mainTech = m.extendedProps.trabajadores[0];
              techName = `${mainTech.nombre} ${mainTech.apellido}`.trim() || 'No asignado';
          } else if (m.extendedProps?.trabajador) {
              techName = `${m.extendedProps.trabajador.nombre} ${m.extendedProps.trabajador.apellido}`.trim() || 'No asignado';
          }
          
          let time = '';
          if (m.start.includes('T')) {
              time = m.start.split('T')[1].substring(0, 5); // 08:00
          }
          
          return {
              id: m.id,
              clientName,
              type: this.formatType(m.extendedProps?.tipo_trabajo),
              technicianName: techName,
              time,
              address,
              avatarColor: avatarColors[index % avatarColors.length],
              originalData: m
          };
      });
      
      // 2. Initial Selection
      if (this.schedules.length > 0) {
          this.selectedSchedule = this.schedules[0];
          this.updateDetailView(this.selectedSchedule);
      } else {
          this.selectedSchedule = null;
          this.updateDetailView(null);
      }
      
      // 3. Próximos días (Upcoming)
      const futureMantenimientos = this.allMantenimientos.filter(m => {
          const mDate = m.start.split('T')[0];
          return mDate > todayStr;
      }).sort((a, b) => a.start.localeCompare(b.start));
      
      this.upcoming = futureMantenimientos.slice(0, 5).map(m => {
          const isEmergency = m.extendedProps?.tipo_trabajo === 'emergencia';
          return {
              date: this.formatDateShort(m.start.split('T')[0]),
              type: this.formatType(m.extendedProps?.tipo_trabajo),
              alert: isEmergency
          };
      });
  }
  
  updateDetailView(schedule: Schedule | null) {
      if (schedule) {
          this.firstJobClientName = schedule.clientName;
          this.firstJobClientAddress = schedule.address;
          this.firstJobAvatarColor = schedule.avatarColor;
          
          // Crear un timeline basado en los datos del mantenimiento seleccionado
          const dateFmt = this.formatDate(schedule.originalData.start.split('T')[0]);
          this.timeline = [
              { date: dateFmt, description: 'Inicio programado', completed: true },
              { date: dateFmt, description: schedule.originalData.title || 'Trabajo asignado', completed: true },
              { date: dateFmt, description: schedule.originalData.extendedProps?.descripcion || 'Pendiente de ejecución', completed: false }
          ];
      } else {
          this.firstJobClientName = 'Sin trabajos hoy';
          this.firstJobClientAddress = 'Libre';
          this.firstJobAvatarColor = 'bg-slate-300';
          this.timeline = [];
      }
  }
  
  formatDate(dateStr: string): string {
      if (!dateStr) return '';
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateShort(dateStr: string): string {
      if (!dateStr) return '';
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  
  formatType(type: string | undefined): string {
      if (!type) return 'Desconocido';
      const map: any = {
          'mantenimiento': 'Mantenimiento',
          'reparacion': 'Reparación',
          'inspeccion': 'Inspección',
          'emergencia': 'Emergencia'
      };
      return map[type] || type;
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
