import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';
import { ProgrammingComponent } from './programming/programming.component';

// Specialized components



@Component({ 
  template: `<app-placeholder-page title="Gestión de Ascensores" icon="bi bi-briefcase"></app-placeholder-page>`, 
  standalone: true,
  imports: [PlaceholderPageComponent]
})
export class ElevatorsComponent {}




@Component({ 
  template: `<app-placeholder-page title="Reportes" icon="bi bi-bar-chart-line"></app-placeholder-page>`, 
  standalone: true,
  imports: [PlaceholderPageComponent]
})
export class ReportsComponent {}

@Component({ 
  template: `<app-placeholder-page title="Asistente IA" icon="bi bi-robot"></app-placeholder-page>`, 
  standalone: true,
  imports: [PlaceholderPageComponent]
})
export class AIAssistantComponent {}

@Component({ 
  template: `<app-placeholder-page title="Configuración" icon="bi bi-gear"></app-placeholder-page>`, 
  standalone: true,
  imports: [PlaceholderPageComponent]
})
export class SettingsComponent {}


export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: ProgrammingComponent },
      { 
        path: 'clients', 
        loadComponent: () => import('./clients/list/client-list.component').then(m => m.ClientListComponent) 
      },
      { path: 'elevators', component: ElevatorsComponent },
      { 
        path: 'technicians', 
        loadComponent: () => import('./technicians/list/technician-list.component').then(m => m.TechnicianListComponent) 
      },
      { 
        path: 'documents', 
        loadComponent: () => import('./documents/list/document-list.component').then(m => m.DocumentListComponent) 
      },
      { path: 'reports', component: ReportsComponent },
      { path: 'ai-assistant', component: AIAssistantComponent },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
