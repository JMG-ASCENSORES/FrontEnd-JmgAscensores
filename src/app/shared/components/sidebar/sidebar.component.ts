import { LucideAngularModule } from 'lucide-angular';
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
  imports: [CommonModule, RouterModule,
    LucideAngularModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private authService = inject(AuthService);
  
  isCollapsed = true; // Start collapsed by default

  @Input() menuItems: MenuItem[] = [
    { label: 'Programación', icon: 'layout-dashboard', route: '/admin/dashboard' },
    { label: 'Clientes', icon: 'users', route: '/admin/clients' },
    { label: 'Técnicos', icon: 'user-cog', route: '/admin/technicians' },
    { label: 'Programación de Mantenimientos', icon: 'calendar-check', route: '/admin/programation' },
    { label: 'Equipos', icon: 'package', route: '/admin/elevators' },
    { label: 'Documentos', icon: 'file-text', route: '/admin/documents' },
    { label: 'Reportes', icon: 'bar-chart-2', route: '/admin/reports' },
    { label: 'Asistente IA', icon: 'bot', route: '/admin/ai-assistant' },
    { label: 'Configuración', icon: 'settings-2', route: '/admin/settings' }
  ];

  @Output() logoutRequest = new EventEmitter<void>();

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.logoutRequest.emit();
  }
}
