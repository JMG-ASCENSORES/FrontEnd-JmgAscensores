import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { MantenimientoService } from '../services/mantenimiento.service';
import { Mantenimiento } from '../models/mantenimiento.interface';
import { ProgramacionModalComponent } from './programacion-modal.component';

@Component({
  selector: 'app-maintenance-scheduling',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, ProgramacionModalComponent],
  templateUrl: './maintenance-scheduling.component.html',
  styleUrls: ['./maintenance-scheduling.component.css']
})
export class MaintenanceSchedulingComponent implements OnInit {
  private mantenimientoService = inject(MantenimientoService);
  private cdr = inject(ChangeDetectorRef);

  mantenimientos: Mantenimiento[] = [];
  isLoading = true;
  errorMessage = '';
  
  // Modal state
  showModal = false;
  selectedMantenimiento: Mantenimiento | null = null;
  selectedDate: string | null = null; // For passing clicked date to modal

  // Calendar
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'title',
      center: '',
      right: 'prev,next today'
    },
    locale: 'es',
    firstDay: 0,
    contentHeight: 'auto',
    fixedWeekCount: false,
    showNonCurrentDates: true,
    
    dayHeaderContent: (arg) => {
      const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
      return days[arg.date.getDay()];
    },
    
    events: [],
    
    eventClick: (info) => {
      const id = parseInt(info.event.id);
      const mantenimiento = this.mantenimientos.find(m => m.id === id);
      if (mantenimiento) {
        this.editMantenimiento(mantenimiento);
      }
    },
    
    dateClick: (info) => {
      this.openModalWithDate(info.dateStr);
    }
  };

  constructor() {}

  ngOnInit(): void {
    this.loadMantenimientos();
  }

  loadMantenimientos(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.mantenimientoService.listar().subscribe({
      next: (data) => {
        console.log('Mantenimientos loaded:', data);
        this.mantenimientos = data;
        this.updateCalendarEvents();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading mantenimientos:', err);
        this.errorMessage = err.message || 'Error al cargar los mantenimientos';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateCalendarEvents(): void {
    const events: EventInput[] = this.mantenimientos.map(mant => ({
      id: mant.id.toString(),
      title: mant.title,
      start: mant.start,
      end: mant.end,
      backgroundColor: mant.color,
      borderColor: mant.color,
      extendedProps: mant.extendedProps
    }));

    this.calendarOptions = {
      ...this.calendarOptions,
      events: events
    };
  }

  // Modal methods
  openModal(): void {
    this.selectedMantenimiento = null;
    this.selectedDate = null;
    this.showModal = true;
  }

  openModalWithDate(dateStr: string): void {
    this.selectedMantenimiento = null;
    this.selectedDate = dateStr;
    this.showModal = true;
  }

  editMantenimiento(mantenimiento: Mantenimiento): void {
    this.selectedMantenimiento = mantenimiento;
    this.selectedDate = null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedMantenimiento = null;
    this.selectedDate = null;
  }

  onMantenimientoSaved(): void {
    this.closeModal();
    this.loadMantenimientos();
  }

  deleteMantenimiento(id: number): void {
    if (!confirm('¿Está seguro de eliminar este mantenimiento?')) {
      return;
    }

    this.mantenimientoService.eliminar(id).subscribe({
      next: () => {
        this.loadMantenimientos();
      },
      error: (err) => {
        console.error('Error deleting mantenimiento:', err);
        alert('Error al eliminar el mantenimiento');
      }
    });
  }

  // Helpers
  getTipoTrabajoLabel(tipo: string | undefined): string {
    if (!tipo) return 'Desconocido';
    const labels: Record<string, string> = {
      'mantenimiento': 'Mantenimiento',
      'reparacion': 'Reparación',
      'inspeccion': 'Inspección',
      'emergencia': 'Emergencia'
    };
    return labels[tipo] || tipo;
  }

  getTipoTrabajoColor(tipo: string | undefined): string {
     if (!tipo) return 'bg-gray-100 text-gray-700';
    const colors: Record<string, string> = {
      'mantenimiento': 'bg-blue-100 text-blue-700',
      'reparacion': 'bg-orange-100 text-orange-700',
      'inspeccion': 'bg-green-100 text-green-700',
      'emergencia': 'bg-red-100 text-red-700'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700';
  }

  getEstadoColor(estado: string | undefined): string {
    if (!estado) return 'bg-gray-100 text-gray-700';
    const colors: Record<string, string> = {
      'pendiente': 'bg-yellow-100 text-yellow-700',
      'en_progreso': 'bg-blue-100 text-blue-700',
      'completado': 'bg-green-100 text-green-700',
      'cancelado': 'bg-red-100 text-red-700'
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  }

  formatFecha(isoString: string): string {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('es-ES');
  }

  formatHora(isoString: string): string {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTrabajadorNombre(mant: Mantenimiento): string {
    const trabajador = mant.extendedProps?.trabajador;
    if (trabajador) {
      return `${trabajador.nombre || ''} ${trabajador.apellido || ''}`.trim();
    }
    return 'No asignado';
  }
}
