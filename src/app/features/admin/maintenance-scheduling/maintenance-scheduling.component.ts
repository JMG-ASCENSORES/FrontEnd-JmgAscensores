import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, signal } from '@angular/core';
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

  // Notification state: Map of date string -> Set of technicians notified
  notifiedTechsByDate = new Map<string, Set<number>>();

  // Toast state
  toast = signal<{ message: string; type: 'success' | 'error'; title: string } | null>(null);
  private toastTimeout: any;

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
      // Usamos setTimeout para asegurar que FullCalendar esté listo
      setTimeout(() => {
        const start = info.startStr.split('T')[0];
        const end = info.endStr.split('T')[0];
        this.loadMantenimientos(start, end);
      }, 0);
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
    const paramDate = this.route.snapshot.queryParamMap.get('date');
    if (paramDate) {
      this.selectedFilterDate = paramDate;
      this.calendarOptions.initialDate = paramDate;
      
      // Si ya sabemos la fecha, podemos llamar a la carga inmediatamente si el rango es manejable
      // Pero mejor confiar en datesSet que ya tiene el rango de la vista actual.
      // Sin embargo, para mayor seguridad forzamos un ciclo de detección
      this.cdr.detectChanges();
    }
  }

  loadMantenimientos(start?: string, end?: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Carga inicial del mes (ligera, detailed=false para evitar joins masivos de red)
    this.mantenimientoService.listar(start, end, undefined, false).subscribe({
      next: (data) => {
        this.mantenimientos = data;
        this.updateCalendarEvents();
        // Cargar detalles exhaustivos solo del día seleccionado en el panel lateral
        this.loadDayDetails(); 
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

    // Luego disparamos la carga detallada del día activo
    this.loadDayDetails();
  }

  loadDayDetails(): void {
    if (!this.selectedFilterDate) {
      this.filteredMantenimientos = [];
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    // Formatear desde las 00:00 hasta las 23:59 del día explicitamente
    const dayStart = `${this.selectedFilterDate}T00:00:00`;
    const dayEnd = `${this.selectedFilterDate}T23:59:59`;

    this.mantenimientoService.listar(dayStart, dayEnd, undefined, true).subscribe({
      next: (data) => {
        this.filteredMantenimientos = data;
        // Sort chronologically by start time
        this.filteredMantenimientos.sort((a, b) => a.start.localeCompare(b.start));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar detalle del día:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
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
    
    // Forzamos la detección de cambios para que FullCalendar sea notificado reactivamente
    this.cdr.detectChanges();
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
    if (this.calendarComponent) {
      const api = this.calendarComponent.getApi();
      const view = api.view;
      this.loadMantenimientos(view.activeStart.toISOString().split('T')[0], view.activeEnd.toISOString().split('T')[0]);
    } else {
      this.loadMantenimientos();
    }
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
        if (this.calendarComponent) {
          const api = this.calendarComponent.getApi();
          const view = api.view;
          this.loadMantenimientos(view.activeStart.toISOString().split('T')[0], view.activeEnd.toISOString().split('T')[0]);
        } else {
          this.loadMantenimientos();
        }
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

  // ─── WhatsApp Integration ──────────────────────────────────────────────

  getTechniciansForDay(): { tech: any; services: Mantenimiento[] }[] {
    const techGroups = new Map<number, { tech: any; services: Mantenimiento[] }>();

    this.filteredMantenimientos.forEach(mant => {
      // Usar el array de trabajadores completo calculado por el backend
      const techs = (mant.extendedProps?.trabajadores || []).filter((t: any) => t && t.trabajador_id);

      techs.forEach((t: any) => {
        if (!techGroups.has(t.trabajador_id)) {
          techGroups.set(t.trabajador_id, { tech: t, services: [] });
        }
        techGroups.get(t.trabajador_id)!.services.push(mant);
      });
    });

    return Array.from(techGroups.values())
      .sort((a, b) => (a.tech.nombre || '').localeCompare(b.tech.nombre || ''));
  }

  sendWhatsAppRoute(techData: { tech: any; services: Mantenimiento[] }): void {
    const { tech, services } = techData;
    if (!tech.telefono || tech.telefono.trim() === '') {
      this.showToast(`El técnico ${tech.nombre} no tiene un teléfono registrado.`, 'error', 'Datos incompletos');
      return;
    }

    const fechaStr = this.formatSelectedDate();
    let message = `Hola *${tech.nombre}*, tu ruta para hoy *${fechaStr}* consta de ${services.length} servicios:\n\n`;

    services.forEach((s, index) => {
      const hora = this.formatHora(s.start);
      const cliente = s.extendedProps?.cliente?.nombre_comercial || 'Cliente desconocido';
      const equipo = s.extendedProps?.ascensor?.numero_serie || 'Equipo';
      const tipo = this.getTipoTrabajoLabel(s.extendedProps?.tipo_trabajo);
      
      message += `${index + 1}. *${hora}* - ${cliente} (${tipo})\n`;
      message += `   📍 Ref: ${equipo}\n\n`;
    });

    message += `Por favor, confirma recepción. ¡Buen turno! 🚀`;

    const encodedMessage = encodeURIComponent(message);
    // Limpiar espacios en el teléfono y añadir código de país
    const cleanPhone = tech.telefono.replace(/\s+/g, '');
    const whatsappUrl = `https://wa.me/51${cleanPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Marcar como notificado en la sesión actual
    if (!this.notifiedTechsByDate.has(this.selectedFilterDate)) {
      this.notifiedTechsByDate.set(this.selectedFilterDate, new Set<number>());
    }
    this.notifiedTechsByDate.get(this.selectedFilterDate)?.add(tech.trabajador_id);
    
    this.cdr.detectChanges();
  }

  isTechNotified(techId: number): boolean {
    return !!this.notifiedTechsByDate.get(this.selectedFilterDate)?.has(techId);
  }

  showToast(message: string, type: 'success' | 'error' = 'error', title: string = 'Aviso'): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast.set({ message, type, title });
    this.toastTimeout = setTimeout(() => {
      // Add a class for fade out before nulling? 
      // For now just null it, the CSS handles basic enter.
      this.toast.set(null);
    }, 3500);
  }
}
