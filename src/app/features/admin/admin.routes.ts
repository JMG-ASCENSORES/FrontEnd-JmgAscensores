import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { ProgrammingComponent } from './programming/programming.component';
import { SettingsComponent } from './settings/settings.component';


export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: ProgrammingComponent },
      { 
        path: 'maintenance', 
        loadComponent: () => import('./maintenance-scheduling/maintenance-scheduling.component').then(m => m.MaintenanceSchedulingComponent) 
      },
      { 
        path: 'clients', 
        loadComponent: () => import('./clients/list/client-list.component').then(m => m.ClientListComponent) 
      },
      { 
        path: 'elevators', 
        loadComponent: () => import('./elevators/list/elevator-list.component').then(m => m.ElevatorListComponent) 
      },
      { 
        path: 'technicians', 
        loadComponent: () => import('./technicians/list/technician-list.component').then(m => m.TechnicianListComponent) 
      },
      { 
        path: 'documents', 
        loadComponent: () => import('./documents/list/document-list.component').then(m => m.DocumentListComponent) 
      },
      { path: 'reports', loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'ai-assistant', loadComponent: () => import('./ai-assistant/ai-assistant.component').then(m => m.AIAssistantComponent) },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
