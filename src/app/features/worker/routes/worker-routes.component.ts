import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { MantenimientoService } from '../../admin/services/mantenimiento.service';
import { Mantenimiento } from '../../admin/models/mantenimiento.interface';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-worker-routes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './worker-routes.component.html',
  styleUrls: ['./worker-routes.component.css'],
  host: {
      class: 'flex-1 flex flex-col bg-slate-50 relative'
  }
})
export class WorkerRoutesComponent implements OnInit {
  private authService = inject(AuthService);
  private mantenimientoService = inject(MantenimientoService);
  private sanitizer = inject(DomSanitizer);

  // States
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // Data
  allRoutes = signal<Mantenimiento[]>([]);
  
  // Dates selector
  dates = signal<{date: Date, str: string, label: string}[]>([]);
  selectedDateStr = signal<string>('');
  
  // Detail View State
  selectedRoute = signal<Mantenimiento | null>(null);

  ngOnInit() {
    this.generateDateSlider();
    this.loadMyRoutes();
  }

  generateDateSlider() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dateArray = [];
    
    // Add yesterday, today, and next 5 days
    for (let i = -1; i <= 6; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        
        let label = '';
        if (i === -1) label = 'Ayer';
        else if (i === 0) label = 'Hoy';
        else if (i === 1) label = 'Mañana';
        else label = d.toLocaleDateString('es-ES', { weekday: 'short' });
        
        // Formato YYYY-MM-DD
        const userTzOffset = d.getTimezoneOffset() * 60000;
        const dLocal = new Date(d.getTime() - userTzOffset);
        const str = dLocal.toISOString().split('T')[0];
        
        dateArray.push({ date: d, str, label });
    }
    
    this.dates.set(dateArray);
    this.selectedDateStr.set(dateArray[1].str); // Selected today
  }

  loadMyRoutes() {
    const user = this.authService.currentUser();
    if (!user) return;
    
    this.isLoading.set(true);
    // Fetch last 30 days and future 30 days for this user
    const start = new Date();
    start.setDate(start.getDate() - 10);
    const end = new Date();
    end.setDate(end.getDate() + 30);
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    this.mantenimientoService.listar(startStr, endStr, user.id).subscribe({
      next: (data) => {
        this.allRoutes.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando rutas', err);
        this.error.set('No se pudieron cargar tus rutas. Intenta nuevamente.');
        this.isLoading.set(false);
      }
    });
  }

  // Computed: rutas filtradas para el día seleccionado
  filteredRoutes = computed(() => {
     const targetDate = this.selectedDateStr();
     return this.allRoutes().filter(m => m.start.startsWith(targetDate))
                            .sort((a,b) => a.start.localeCompare(b.start));
  });

  selectDate(dateStr: string) {
      this.selectedDateStr.set(dateStr);
  }

  openRouteDetails(route: Mantenimiento) {
      this.selectedRoute.set(route);
  }

  closeRouteDetails() {
      this.selectedRoute.set(null);
  }

  // Helpers UI
  formatTime(isoString: string): string {
    if (!isoString) return '';
    if (isoString.includes('T')) return isoString.split('T')[1].substring(0, 5);
    return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  getTypeLabel(tipo: string | undefined): string {
    if (!tipo) return 'Trabajo';
    const map: any = {
      'mantenimiento': 'Mantenimiento',
      'reparacion': 'Reparación',
      'inspeccion': 'Inspección',
      'emergencia': 'Emergencia'
    };
    return map[tipo] || tipo;
  }

  getTypeColor(tipo: string | undefined): string {
      if (!tipo) return 'bg-slate-100 text-slate-600';
      const map: any = {
          'mantenimiento': 'bg-blue-100 text-blue-700',
          'reparacion': 'bg-orange-100 text-orange-700',
          'inspeccion': 'bg-green-100 text-green-700',
          'emergencia': 'bg-red-100 text-red-700'
      };
      return map[tipo] || 'bg-slate-100 text-slate-600';
  }

  getStatusIcon(status: string | undefined): string {
       if (!status) return 'bi-clock text-yellow-500';
       const map: any = {
           'pendiente': 'bi-clock text-yellow-500',
           'en_progreso': 'bi-play-circle text-blue-500',
           'completado': 'bi-check-circle-fill text-green-500',
           'cancelado': 'bi-x-circle text-red-500'
       };
       return map[status] || 'bi-circle text-slate-400';
  }

  // Map features
  getAddressQuery(): string {
     const route = this.selectedRoute();
     if (!route) return '';
     let addr = 'Perú'; // Default append country
     if (route.extendedProps?.cliente?.nombre_comercial) {
         addr = `${route.extendedProps.cliente.nombre_comercial}, ${addr}`;
     }
     return addr;
  }

  getSafeMapUrl(): SafeResourceUrl {
      const address = this.getAddressQuery();
      // Usar Google Maps Embed API or OpenStreetMaps. OSM is free without API Key:
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openExternalMap() {
      const address = this.getAddressQuery();
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
  }
}
