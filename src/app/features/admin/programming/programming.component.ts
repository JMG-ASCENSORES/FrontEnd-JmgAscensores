import { LucideAngularModule } from 'lucide-angular';
import { limaDateStr, formatDateLong, formatDateShort as formatDateDisplay, buildWhatsAppUrl } from '../../../shared/utils/date-lima.util';
import { getSpecialtyIcon } from '../../../shared/utils/specialty.utils';
import { Component, OnInit, inject, ChangeDetectorRef, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Import RouterModule for routerLink
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TechnicianService, Technician } from '../services/technician.service';
import { MantenimientoService } from '../services/mantenimiento.service';
import { Mantenimiento, ClienteResumen, TrabajadorResumen, TechnicianNotification, ClientNotification } from '../models/mantenimiento.interface';

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
  imports: [CommonModule, FullCalendarModule, RouterModule,
    LucideAngularModule
  ],
  templateUrl: './programming.component.html',
  styleUrl: './programming.component.scss',
  host: {
    class: 'flex-1 flex flex-col min-h-0'
  }
})
export class ProgrammingComponent implements OnInit {
  @ViewChild('calendar') calendarRef!: FullCalendarComponent;

  private technicianService = inject(TechnicianService);
  private mantenimientoService = inject(MantenimientoService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  currentDate = new Date();
  currentDateStr = limaDateStr();
  
  // Mock Data
  clientCount = 78;
  equipmentCount = 106;

  workers: Worker[] = [];
  isLoading = true;

  allMantenimientos: Mantenimiento[] = [];
  schedules: Schedule[] = [];
  selectedSchedule: Schedule | null = null;
  
  todayStats = { total: 0, pending: 0, emergencies: 0 };
  pastPending: Schedule[] = [];
  hasEmergencyToday = false;
  // Tech ID -> count of services today
  techWorkload = new Map<number, number>();

  firstJobClientName: string = 'Sin selección';
  firstJobClientAddress: string = 'Seleccione una programación';
  firstJobAvatarColor: string = 'bg-slate-300';
  timeline: TimelineItem[] = [];

  upcoming: { date: string; type: string; alert: boolean }[] = [];
  techniciansToNotify: TechnicianNotification[] = [];
  clientsToNotify: ClientNotification[] = [];

  // Notification state: date string -> set of notified technician IDs / client IDs
  notifiedTechIdsByDate = new Map<string, Set<number>>();
  notifiedClientIdsByDate = new Map<string, Set<number>>();

  // Toast state
  toast = signal<{ message: string; type: 'success' | 'error'; title: string } | null>(null);
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

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
        const tieneSchedules = (this.allMantenimientos || []).some(m => m.start && m.start.split('T')[0] === localDateStr);
        if (tieneSchedules) {
            return ['blue-day']; // Esta clase ya existe en CSS (blue rounded square)
        }
        
        return [];
    },
    
    dateClick: (info) => {
        this.router.navigate(['/admin/maintenance'], { queryParams: { date: info.dateStr } });
    }
  };

  constructor() {}

  ngOnInit(): void {
    this.loadWorkers();
    this.loadSchedules();
  }

  loadWorkers() {
    this.isLoading = true;
    this.technicianService.getTechnicians({ estado_activo: true }).subscribe({
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
      this.mantenimientoService.listar(undefined, undefined, undefined, true).subscribe({
          next: (data) => {
              this.allMantenimientos = data || [];
              this.processSchedules();
              this.calendarRef?.getApi().setOption('dayCellClassNames', (arg: any) => {
                  const d = arg.date;
                  const localDateStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
                  return this.allMantenimientos.some(m => m.start && m.start.split('T')[0] === localDateStr) ? ['blue-day'] : [];
              });
          },
          error: (err) => {
              console.error('Error loading schedules', err);
          }
      });
  }
  
  processSchedules() {
      const todayStr = this.currentDateStr;
      
      // 1. "Programaciones del día"
      const todayMantenimientos = this.allMantenimientos.filter(m => m.start.startsWith(todayStr));
      this.schedules = todayMantenimientos.map((m, index) => this.mapToSchedule(m, index));
      
      // 2. No auto-selection: drawer opens on user click
      this.selectedSchedule = null;
      this.updateDetailView(null);
      
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

      // 4. Estadísticas del Día (Stats reales)
      this.todayStats = {
          total: this.schedules.length,
          pending: todayMantenimientos.filter(m => m.extendedProps?.estado === 'pendiente' || !m.extendedProps?.estado).length,
          emergencies: todayMantenimientos.filter(m => m.extendedProps?.tipo_trabajo === 'emergencia').length
      };
      this.hasEmergencyToday = this.todayStats.emergencies > 0;

      // 5. Pendientes de cierre (Días anteriores)
      const pastMantenimientos = this.allMantenimientos.filter(m => {
          const mDate = m.start.split('T')[0];
          const isPast = mDate < todayStr;
          const isPending = m.extendedProps?.estado === 'pendiente' || m.extendedProps?.estado === 'en_progreso' || !m.extendedProps?.estado;
          return isPast && isPending;
      }).sort((a, b) => b.start.localeCompare(a.start));

      this.pastPending = pastMantenimientos.map(m => this.mapToSchedule(m, 0));

      // 6. Carga de Trabajo de Técnicos (Workload)
      this.techWorkload.clear();
      this.schedules.forEach(s => {
          const techs = s.originalData.extendedProps?.trabajador_ids || [];
          if (techs.length === 0 && s.originalData.extendedProps?.trabajador_id) {
              techs.push(s.originalData.extendedProps.trabajador_id);
          }
          techs.forEach(id => {
              this.techWorkload.set(id, (this.techWorkload.get(id) || 0) + 1);
          });
      });
      
      // Compute technicians and clients to notify once to avoid infinite loop in template
      this.techniciansToNotify = this.getTechniciansFromSchedules();
      this.clientsToNotify = this.getClientsFromSchedules();
  }

  private mapToSchedule(m: Mantenimiento, index: number): Schedule {
      const avatarColors = ['bg-yellow-400', 'bg-red-400', 'bg-blue-400', 'bg-green-400'];
      let clientName = 'Sin Cliente';
      let address = 'Sin dirección';
      
      if (m.extendedProps?.cliente) {
          clientName = m.extendedProps.cliente.nombre_comercial || 
                       `${m.extendedProps.cliente.contacto_nombre || ''} ${m.extendedProps.cliente.contacto_apellido || ''}`.trim() || 
                       'Sin Cliente';
          address = m.extendedProps.cliente.direccion || 'Sin dirección registrada';
      }
      
      if (m.extendedProps?.ascensor) {
          const asc = m.extendedProps.ascensor;
          address = `${asc.tipo_equipo || 'Equipo'} - ${asc.marca || ''} ${asc.modelo || ''}`.trim();
      }
      
      let techName = 'No asignado';
      if (m.extendedProps?.trabajadores && m.extendedProps.trabajadores.length > 0) {
          techName = m.extendedProps.trabajadores.map((t: any) => t.nombre).join(', ');
      } else if (m.extendedProps?.trabajador) {
          techName = `${m.extendedProps.trabajador.nombre} ${m.extendedProps.trabajador.apellido}`.trim() || 'No asignado';
      }
      
      let time = '';
      if (m.start.includes('T')) {
          time = m.start.split('T')[1].substring(0, 5);
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
  }
  
  updateDetailView(schedule: Schedule | null) {
      if (schedule) {
          this.firstJobClientName = schedule.clientName;
          const mant = schedule.originalData;
          
          if (mant.extendedProps?.cliente?.direccion) {
              this.firstJobClientAddress = mant.extendedProps.cliente.direccion;
          } else if (mant.extendedProps?.ascensor) {
              const asc = mant.extendedProps.ascensor;
              this.firstJobClientAddress = `${asc.tipo_equipo} | ${asc.marca} (S/N: ${asc.numero_serie || 'N/A'})`;
          } else {
              this.firstJobClientAddress = schedule.address;
          }
          
          this.firstJobAvatarColor = schedule.avatarColor;
          
          const dateFmt = this.formatDate(schedule.originalData.start.split('T')[0]);
          this.timeline = [
              { date: dateFmt, description: 'Inicio programado: ' + schedule.time, completed: true },
              { date: 'Detalle', description: schedule.originalData.title || 'Trabajo asignado', completed: true }
          ];
          
          if (mant.extendedProps?.descripcion) {
              this.timeline.push({ date: 'Notas', description: mant.extendedProps.descripcion, completed: false });
          }
          
          if (mant.extendedProps?.orden_id) {
              this.timeline.push({ date: 'Referencia', description: 'Orden de trabajo #' + mant.extendedProps.orden_id, completed: true });
          }
      } else {
          this.firstJobClientName = 'Sin selección';
          this.firstJobClientAddress = 'Seleccione una programación';
          this.firstJobAvatarColor = 'bg-slate-300';
          this.timeline = [];
      }
  }
  
  formatDate(dateStr: string): string {
      return formatDateLong(dateStr);
  }

  formatDateShort(dateStr: string): string {
      return formatDateDisplay(dateStr);
  }
  
  formatType(type: string | undefined): string {
      if (!type) return 'Desconocido';
      const map: Record<string, string> = {
          'mantenimiento': 'Mantenimiento',
          'reparacion': 'Reparación',
          'inspeccion': 'Inspección',
          'emergencia': 'Emergencia'
      };
      return map[type] || type;
  }

  getRoleColor(specialty: string): string {
    const avatarColors: Record<string, string> = {
      'Supervisor Técnico':          'bg-[#003B73]',
      'Técnico de Mantenimiento':    'bg-blue-500',
      'Técnico de Reparaciones':     'bg-amber-500',
      'Técnico General':             'bg-emerald-500',
    };
    return avatarColors[specialty] || 'bg-slate-500';
  }

  getRoleIcon(specialty: string): string {
    return getSpecialtyIcon(specialty);
  }

  // ─── WhatsApp Integration ──────────────────────────────────────────────

  getTechniciansFromSchedules(): TechnicianNotification[] {
    const techGroups = new Map<number, TechnicianNotification>();

    // We use originalData from schedules because it only contains today's filtered items
    this.schedules.forEach(schedule => {
      const mant = schedule.originalData;
      let techs = (mant.extendedProps?.trabajadores || []).filter((t: TrabajadorResumen) => t && t.trabajador_id);
      if (techs.length === 0 && mant.extendedProps?.trabajador?.trabajador_id) {
        techs = [mant.extendedProps.trabajador];
      }

      techs.forEach((t: TrabajadorResumen) => {
        if (!techGroups.has(t.trabajador_id)) {
          techGroups.set(t.trabajador_id, { tech: t, services: [] });
        }
        techGroups.get(t.trabajador_id)!.services.push(mant);
      });
    });

    return Array.from(techGroups.values())
      .sort((a, b) => (a.tech.nombre || '').localeCompare(b.tech.nombre || ''));
  }

  getClientsFromSchedules(): ClientNotification[] {
    const clientGroups = new Map<number, ClientNotification>();

    this.schedules.forEach(schedule => {
      const mant = schedule.originalData;
      const client = mant.extendedProps?.cliente;

      if (client && client.cliente_id) {
        if (!clientGroups.has(client.cliente_id)) {
          clientGroups.set(client.cliente_id, { client, services: [] });
        }
        clientGroups.get(client.cliente_id)!.services.push(mant);
      }
    });

    return Array.from(clientGroups.values())
      .sort((a, b) => {
        const nameA = a.client.nombre_comercial || `${a.client.contacto_nombre || ''} ${a.client.contacto_apellido || ''}`.trim();
        const nameB = b.client.nombre_comercial || `${b.client.contacto_nombre || ''} ${b.client.contacto_apellido || ''}`.trim();
        return nameA.localeCompare(nameB);
      });
  }

  sendWhatsAppRoute(techData: TechnicianNotification): void {
    const { tech, services } = techData;
    if (!tech.telefono || tech.telefono.trim() === '') {
      this.showToast(`El técnico ${tech.nombre} no tiene un teléfono registrado.`, 'error', 'Datos incompletos');
      return;
    }

    const fechaStr = this.formatDate(services[0]?.start?.split('T')[0] || this.currentDateStr);
    let message = `Estimado(a) *${tech.nombre}*, se le informa su ruta de trabajo programada para el día *${fechaStr}*, la cual consta de ${services.length} servicios:\n\n`;

    services.forEach((s, index) => {
      let hora = '';
      if (s.start && s.start.includes('T')) {
         hora = s.start.split('T')[1].substring(0, 5);
      }
      
      const cliente = s.extendedProps?.cliente?.nombre_comercial || `${s.extendedProps?.cliente?.contacto_nombre || ''} ${s.extendedProps?.cliente?.contacto_apellido || ''}`.trim() || 'Cliente desconocido';
      const equipo = s.extendedProps?.ascensor?.numero_serie || 'Equipo';
      const tipo = this.formatType(s.extendedProps?.tipo_trabajo);
      
      message += `${index + 1}. *${hora}* - ${cliente} (${tipo})\n`;
      message += `   Ref: ${equipo}\n\n`;
    });

    message += `Por favor, confirmar la recepción de este mensaje. Atentamente, Administración JMG Ascensores.`;

    window.open(buildWhatsAppUrl(tech.telefono, message), '_blank');
    
    // Marcar como notificado
    if (!this.notifiedTechIdsByDate.has(this.currentDateStr)) {
      this.notifiedTechIdsByDate.set(this.currentDateStr, new Set<number>());
    }
    this.notifiedTechIdsByDate.get(this.currentDateStr)?.add(tech.trabajador_id);
    this.cdr.detectChanges();
  }

  sendWhatsAppClient(schedule: Schedule): void {
    const raw = schedule.originalData;
    const cliente = raw.extendedProps?.cliente;

    if (!cliente) {
        this.showToast('No se encontró información del cliente para este trabajo.', 'error', 'Error de Datos');
        return;
    }

    this.sendNotificationToClient(cliente, raw);
  }

  sendWhatsAppClients(clientData: ClientNotification): void {
    const { client, services } = clientData;

    if (!client) {
        this.showToast('No se encontró información del cliente.', 'error', 'Error de Datos');
        return;
    }

    // Enviar notificación del primer servicio (con mención de los demás si hay)
    if (services.length > 0) {
        this.sendNotificationToClient(client, services[0]);
    }

    // Marcar como notificado
    if (!this.notifiedClientIdsByDate.has(this.currentDateStr)) {
      this.notifiedClientIdsByDate.set(this.currentDateStr, new Set<number>());
    }
    this.notifiedClientIdsByDate.get(this.currentDateStr)?.add(client.cliente_id);
    this.cdr.detectChanges();
  }

  private sendNotificationToClient(cliente: ClienteResumen, mantenimiento: Mantenimiento): void {
    // Lógica robusta por tipo de cliente para obtener el teléfono
    let telefono = '';
    if (cliente.tipo_cliente === 'persona') {
        telefono = cliente.telefono || cliente.contacto_telefono || '';
    } else {
        telefono = cliente.contacto_telefono || cliente.telefono || '';
    }

    if (!telefono) {
        const clientName = cliente.nombre_comercial || `${cliente.contacto_nombre || ''} ${cliente.contacto_apellido || ''}`.trim();
        this.showToast(`El cliente ${clientName} no tiene un teléfono registrado.`, 'error', 'Datos incompletos');
        return;
    }

    const fechaStr = this.formatDate(mantenimiento.start?.split('T')[0] || this.currentDateStr);
    let hora = '';
    if (mantenimiento.start && mantenimiento.start.includes('T')) {
        hora = mantenimiento.start.split('T')[1].substring(0, 5);
    }

    const nombreCliente = `${cliente.contacto_nombre || ''} ${cliente.contacto_apellido || ''}`.trim() || cliente.nombre_comercial || 'Estimado Cliente';
    const tipoTrabajo = this.formatType(mantenimiento.extendedProps?.tipo_trabajo);
    const equipo = mantenimiento.extendedProps?.ascensor?.numero_serie || 'su equipo';

    let message = `Estimado(a) *${nombreCliente}*,\n\n`;
    message += `JMG Ascensores le informa que tiene programado un servicio de *${tipoTrabajo}* para el día *${fechaStr}* a las *${hora}* para el equipo [Ref: ${equipo}].\n\n`;
    message += `Atentamente,\nAdministración JMG Ascensores.`;

    window.open(buildWhatsAppUrl(telefono, message), '_blank');

    const clientName = cliente.nombre_comercial || `${cliente.contacto_nombre || ''} ${cliente.contacto_apellido || ''}`.trim();
    this.showToast(`Enlace de WhatsApp generado para ${clientName}`, 'success', 'Notificación');
  }

  isTechNotified(techId: number): boolean {
    return !!this.notifiedTechIdsByDate.get(this.currentDateStr)?.has(techId);
  }

  isClientNotified(clientId: number): boolean {
    return !!this.notifiedClientIdsByDate.get(this.currentDateStr)?.has(clientId);
  }

  getWorkloadBadge(techId: number): string | null {
      const count = this.techWorkload.get(techId);
      if (!count) return null;
      return count === 1 ? '1 servicio' : `${count} servicios`;
  }

  showToast(message: string, type: 'success' | 'error' = 'error', title: string = 'Aviso'): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast.set({ message, type, title });
    this.toastTimeout = setTimeout(() => {
      this.toast.set(null);
    }, 3500);
  }
}
