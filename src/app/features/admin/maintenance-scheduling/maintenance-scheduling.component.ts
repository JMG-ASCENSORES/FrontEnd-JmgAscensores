import { Component, OnInit, inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
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
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  mantenimientos: Mantenimiento[] = [];
  filteredMantenimientos: Mantenimiento[] = [];
  isLoading = true;
  errorMessage = '';
  
  selectedFilterDate: string = (() => {
    // Si la inicialización es temporal, se sobrescribirá luego en ngOnInit
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  })();
  
  // Modal state
  showModal = false;
  selectedMantenimiento: Mantenimiento | null = null;
  selectedDate: string | null = null;

  // Delete confirmation state
  showDeleteConfirm = false;
  deleteTargetId: number | null = null;
  deleteTargetName = '';

  // Calendar
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    customButtons: {
      miHoy: {
        text: 'Hoy',
        click: this.goToToday.bind(this)
      }
    },
    headerToolbar: {
      left: 'title',
      center: '',
      right: 'prev,next miHoy'
    },
    locale: 'es',
    firstDay: 0,
    contentHeight: 'auto',
    fixedWeekCount: false,
    showNonCurrentDates: true,
    dayMaxEvents: 4,
    eventDisplay: 'block',
    
    dayHeaderContent: (arg) => {
      const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
      return days[arg.date.getDay()];
    },
    
    dayCellClassNames: (arg: any) => {
      const d = arg.date as Date;
      const localDateStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
      const isSelected = localDateStr === this.selectedFilterDate;
      return isSelected ? ['selected-date-cell'] : [];
    },
    
    events: [],
    
    eventClick: (info) => {
      const id = parseInt(info.event.id);
      const mantenimiento = this.mantenimientos.find(m => m.id === id);
      if (mantenimiento) {
        // Solo actualizamos el día seleccionado al día del evento
        const eventDate = mantenimiento.start.split('T')[0];
        if (this.selectedFilterDate !== eventDate) {
          this.selectedFilterDate = eventDate;
          this.filterMantenimientos();
        }
      }
    },
    
    dateClick: (info) => {
      this.selectedFilterDate = info.dateStr;
      this.filterMantenimientos();
    },
    
    datesSet: (info) => {
      const start = info.startStr.split('T')[0];
      const end = info.endStr.split('T')[0];
      this.loadMantenimientos(start, end);
    }
  };

  constructor() {}

  goToToday(): void {
    if (this.calendarComponent) {
      const api = this.calendarComponent.getApi();
      api.today();
    }
    
    // Definimos el día de hoy
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    this.selectedFilterDate = d.toISOString().split('T')[0];
    
    this.filterMantenimientos();
  }

  ngOnInit(): void {
    // Check if there's a specific date requested from another view (like Dashboard)
    const paramDate = this.route.snapshot.queryParamMap.get('date');
    if (paramDate) {
      this.selectedFilterDate = paramDate;
      // Set the initial date for the calendar so it opens in the requested month/day
      this.calendarOptions.initialDate = paramDate;
    }
  }

  loadMantenimientos(start?: string, end?: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.mantenimientoService.listar(start, end, undefined, true).subscribe({
      next: (data) => {
        console.log('Mantenimientos loaded:', data);
        this.mantenimientos = data;
        this.filterMantenimientos();
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

  filterMantenimientos(): void {
    if (!this.selectedFilterDate) {
      this.filteredMantenimientos = [...this.mantenimientos];
    } else {
      this.filteredMantenimientos = this.mantenimientos.filter(m => {
        const mantDate = m.start.split('T')[0];
        return mantDate === this.selectedFilterDate;
      });
    }
    
    // Sort chronologically by start time (morning to evening)
    this.filteredMantenimientos.sort((a, b) => a.start.localeCompare(b.start));
    
    // Update calendar options to reflect the selected date class
    this.calendarOptions = {
      ...this.calendarOptions,
      dayCellClassNames: (arg: any) => {
        const d = arg.date as Date;
        const localDateStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
        const isSelected = localDateStr === this.selectedFilterDate;
        return isSelected ? ['selected-date-cell'] : [];
      }
    };
    
    this.cdr.detectChanges();
  }

  updateCalendarEvents(): void {
    const events: EventInput[] = this.mantenimientos.map(mant => ({
      id: mant.id.toString(),
      title: this.getTipoTrabajoLabel(mant.extendedProps?.tipo_trabajo) || mant.title,
      start: mant.start,
      end: mant.end,
      backgroundColor: this.getEventColor(mant.extendedProps?.tipo_trabajo),
      borderColor: this.getEventColor(mant.extendedProps?.tipo_trabajo),
      textColor: '#ffffff',
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
    this.selectedDate = this.selectedFilterDate || null;
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

  // Solicita confirmación antes de eliminar
  requestDelete(mant: Mantenimiento): void {
    this.deleteTargetId   = mant.id;
    this.deleteTargetName = mant.title || `Programación #${mant.id}`;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (!this.deleteTargetId) return;
    this.mantenimientoService.eliminar(this.deleteTargetId).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.deleteTargetId = null;
        this.loadMantenimientos();
      },
      error: (err) => {
        console.error('Error deleting:', err);
        this.errorMessage = 'Error al eliminar la programación';
        this.showDeleteConfirm = false;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteTargetId = null;
    this.deleteTargetName = '';
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

  getEventColor(tipo: string | undefined): string {
    const typeStr = (tipo || '').toLowerCase();
    switch (typeStr) {
      case 'mantenimiento': return '#003B73'; // Azul oscuro sidebar
      case 'reparacion': return '#C2410C'; // Naranja oscuro reactivo
      case 'inspeccion': return '#15803D'; // Verde oscuro profesional
      case 'emergencia': return '#B91C1C'; // Rojo oscuro alerta
      default: return '#475569'; // Slate 600
    }
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

  getEstadoLabel(estado: string | undefined): string {
    if (!estado) return 'Desconocido';
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'en_progreso': 'En Progreso',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return labels[estado] || estado;
  }

  formatSelectedDate(): string {
    if (!this.selectedFilterDate) return 'fechas seleccionadas';
    const d = new Date(this.selectedFilterDate + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
