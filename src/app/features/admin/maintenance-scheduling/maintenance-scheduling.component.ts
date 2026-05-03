import { LucideAngularModule } from 'lucide-angular';
import { limaDateStr, limaTimeStr, buildWhatsAppUrl } from '../../../shared/utils/date-lima.util';
import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { MantenimientoService } from '../services/mantenimiento.service';
import { MantenimientoFijoService } from '../services/mantenimiento-fijo.service';
import { Mantenimiento, MantenimientoFijo } from '../models/mantenimiento.interface';
import { ProgramacionModalComponent } from './programacion-modal.component';
import { MantenimientoFijoModalComponent } from './mantenimiento-fijo-modal/mantenimiento-fijo-modal.component';

@Component({
  selector: 'app-maintenance-scheduling',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, ProgramacionModalComponent, MantenimientoFijoModalComponent,
    LucideAngularModule
  ],
  templateUrl: './maintenance-scheduling.component.html',
  styleUrl: './maintenance-scheduling.component.scss'
})
export class MaintenanceSchedulingComponent implements OnInit {
  private mantenimientoService = inject(MantenimientoService);
  private mantenimientoFijoService = inject(MantenimientoFijoService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  mantenimientos: Mantenimiento[] = [];
  filteredMantenimientos: Mantenimiento[] = [];
  isLoading = true;
  errorMessage = '';
  
  selectedFilterDate: string = limaDateStr();
  
  // Modal state
  showModal = false;
  selectedMantenimiento: Mantenimiento | null = null;
  selectedDate: string | null = null;

  // Fixed Maintenance Modal State
  showFixedModal = false;
  selectedFixedMantenimiento: MantenimientoFijo | null = null;

  // Delete confirmation state
  showDeleteConfirm = false;
  deleteTargetId: number | null = null;
  deleteTargetName = '';
  isFixedDeletion = false;

  // Notification state
  notifiedTechsByDate = new Map<string, Set<number>>();
  techniciansToNotify: { tech: any; services: Mantenimiento[] }[] = [];

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
      setTimeout(() => {
        const start = info.startStr.split('T')[0];
        const end = info.endStr.split('T')[0];
        this.loadMantenimientos(start, end);
      }, 0);
    }
  };

  constructor() {}

  ngOnInit(): void {
    const paramDate = this.route.snapshot.queryParamMap.get('date');
    if (paramDate) {
      this.selectedFilterDate = paramDate;
      this.calendarOptions.initialDate = paramDate;
      this.cdr.detectChanges();
    }
  }

  goToToday(): void {
    if (this.calendarComponent) {
      const api = this.calendarComponent.getApi();
      api.today();
    }
    this.selectedFilterDate = limaDateStr();
    this.filterMantenimientos();
  }

  loadMantenimientos(start?: string, end?: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.mantenimientoService.listar(start, end, undefined, false).subscribe({
      next: (data) => {
        this.mantenimientos = data;
        this.updateCalendarEvents();
        this.loadDayDetails(); 
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cargar los mantenimientos';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterMantenimientos(): void {
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
    this.loadDayDetails();
  }

  loadDayDetails(): void {
    if (!this.selectedFilterDate) {
      this.filteredMantenimientos = [];
      this.techniciansToNotify = [];
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    const dayStart = `${this.selectedFilterDate}T00:00:00`;
    const dayEnd = `${this.selectedFilterDate}T23:59:59`;

    this.mantenimientoService.listar(dayStart, dayEnd, undefined, true).subscribe({
      next: (data) => {
        this.filteredMantenimientos = data;
        this.filteredMantenimientos.sort((a, b) => a.start.localeCompare(b.start));
        this.techniciansToNotify = this.getTechniciansForDay();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
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

  // Fixed Maintenance Modal methods
  openFixedModal(fixed?: MantenimientoFijo): void {
    this.selectedFixedMantenimiento = fixed || null;
    this.showFixedModal = true;
  }

  closeFixedModal(): void {
    this.showFixedModal = false;
    this.selectedFixedMantenimiento = null;
  }

  onMantenimientoSaved(): void {
    this.closeModal();
    this.refreshView();
  }

  onFixedMantenimientoSaved(): void {
    this.closeFixedModal();
    this.showToast('Mantenimiento fijo programado para los próximos 12 meses.', 'success', 'Éxito');
    this.refreshView();
  }

  private refreshView(): void {
    if (this.calendarComponent) {
      const api = this.calendarComponent.getApi();
      const view = api.view;
      this.loadMantenimientos(view.activeStart.toISOString().split('T')[0], view.activeEnd.toISOString().split('T')[0]);
    } else {
      this.loadMantenimientos();
    }
  }

  editFixedMantenimientoFromJob(mFijoId: number): void {
    this.mantenimientoFijoService.listar().subscribe({
      next: (list) => {
        const found = list.find(f => f.mantenimiento_fijo_id === mFijoId);
        if (found) {
          this.openFixedModal(found);
        } else {
          this.showToast('No se encontró la configuración original del mantenimiento fijo.', 'error');
        }
      }
    });
  }

  requestDeleteFixed(mFijoId: number, name: string): void {
    this.deleteTargetId = mFijoId;
    this.deleteTargetName = `Toda la serie de mantenimientos fijos para: ${name}`;
    this.isFixedDeletion = true;
    this.showDeleteConfirm = true;
  }

  requestDelete(mant: Mantenimiento): void {
    this.deleteTargetId   = mant.id;
    this.deleteTargetName = mant.title || `Programación #${mant.id}`;
    this.isFixedDeletion = false;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (!this.deleteTargetId) return;

    if (this.isFixedDeletion) {
      this.mantenimientoFijoService.eliminar(this.deleteTargetId).subscribe({
        next: () => {
          this.showToast('Mantenimientos fijos eliminados correctamente.', 'success');
          this.finishDeletion();
        },
        error: (err) => {
          this.showToast(err.message || 'Error al eliminar la serie completa.', 'error');
          this.showDeleteConfirm = false;
        }
      });
    } else {
      this.mantenimientoService.eliminar(this.deleteTargetId).subscribe({
        next: () => {
          this.finishDeletion();
        },
        error: () => {
          this.errorMessage = 'Error al eliminar la programación';
          this.showDeleteConfirm = false;
        }
      });
    }
  }

  private finishDeletion(): void {
    this.showDeleteConfirm = false;
    this.deleteTargetId = null;
    this.isFixedDeletion = false;
    this.refreshView();
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
      case 'mantenimiento': return '#003B73'; 
      case 'reparacion': return '#C2410C'; 
      case 'inspeccion': return '#15803D'; 
      case 'emergencia': return '#B91C1C'; 
      default: return '#475569'; 
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
    return isoString ? new Date(isoString).toLocaleDateString('es-ES') : '';
  }

  formatHora(isoString: string): string {
    if (!isoString) return '';
    return limaTimeStr(new Date(isoString));
  }

  getTrabajadorNombre(mant: Mantenimiento): string {
    const trabajador = mant.extendedProps?.trabajador;
    return trabajador ? `${trabajador.nombre || ''} ${trabajador.apellido || ''}`.trim() : 'No asignado';
  }

  getTechniciansForDay(): { tech: any; services: Mantenimiento[] }[] {
    const techGroups = new Map<number, { tech: any; services: Mantenimiento[] }>();
    this.filteredMantenimientos.forEach(mant => {
      let techs = (mant.extendedProps?.trabajadores || []).filter((t: any) => t && t.trabajador_id);
      if (techs.length === 0 && mant.extendedProps?.trabajador?.trabajador_id) {
        techs = [mant.extendedProps.trabajador];
      }
      techs.forEach((t: any) => {
        if (!techGroups.has(t.trabajador_id)) {
          techGroups.set(t.trabajador_id, { tech: t, services: [] });
        }
        techGroups.get(t.trabajador_id)!.services.push(mant);
      });
    });
    return Array.from(techGroups.values()).sort((a, b) => (a.tech.nombre || '').localeCompare(b.tech.nombre || ''));
  }

  sendWhatsAppRoute(techData: { tech: any; services: Mantenimiento[] }): void {
    const { tech, services } = techData;
    if (!tech.telefono) {
      this.showToast(`El técnico ${tech.nombre} no tiene un teléfono registrado.`, 'error', 'Datos incompletos');
      return;
    }
    const fechaStr = this.formatSelectedDate();
    let message = `Estimado(a) *${tech.nombre}*, se le informa su ruta de trabajo programada para el día *${fechaStr}*, la cual consta de ${services.length} servicios:\n\n`;
    services.forEach((s, index) => {
      message += `${index + 1}. *${this.formatHora(s.start)}* - ${s.extendedProps?.cliente?.nombre_comercial || 'Cliente'} (${this.getTipoTrabajoLabel(s.extendedProps?.tipo_trabajo)})\n`;
      message += `   Ref: ${s.extendedProps?.ascensor?.numero_serie || 'Equipo'}\n\n`;
    });
    message += `Por favor, confirmar la recepción de este mensaje. Atentamente, Administración JMG Ascensores.`;
    window.open(buildWhatsAppUrl(tech.telefono, message), '_blank');
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
    this.toastTimeout = setTimeout(() => this.toast.set(null), 3500);
  }
}
