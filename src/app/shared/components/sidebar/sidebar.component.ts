import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private authService = inject(AuthService);
  
  isCollapsed = true; // Start collapsed by default

  @Input() menuItems: MenuItem[] = [
    { label: 'Programación', icon: 'bi bi-grid-fill', route: '/admin/dashboard' },
    { label: 'Clientes', icon: 'bi bi-people', route: '/admin/clients' },
    { label: 'Técnicos', icon: 'bi bi-person-gear', route: '/admin/technicians' },
    { label: 'Programación de Mantenimientos', icon: 'bi bi-calendar-check', route: '/admin/programation' },
    { label: 'Equipos', icon: 'bi bi-box-seam', route: '/admin/elevators' },
    { label: 'Documentos', icon: 'bi bi-file-earmark-text', route: '/admin/documents' },
    { label: 'Reportes', icon: 'bi bi-bar-chart-line', route: '/admin/reports' },
    { label: 'Asistente IA', icon: 'bi bi-robot', route: '/admin/ai-assistant' },
    { label: 'Configuración', icon: 'bi bi-gear', route: '/admin/settings' }
  ];

  @Output() logoutRequest = new EventEmitter<void>();

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.logoutRequest.emit();
  }
}
