import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

// Placeholder components for the router
@Component({ template: `<h2 class="text-2xl font-bold mb-4">Dashboard General</h2><p>Bienvenido al panel de administración.</p>`, standalone: true })
export class AdminDashboardComponent {}

@Component({ template: `<h2 class="text-2xl font-bold mb-4">Gestión de Clientes</h2><p>Tabla de clientes...</p>`, standalone: true })
export class ClientsComponent {}

@Component({ template: `<h2 class="text-2xl font-bold mb-4">Gestión de Ascensores</h2><p>Tabla de ascensores...</p>`, standalone: true })
export class ElevatorsComponent {}

@Component({ template: `<h2 class="text-2xl font-bold mb-4">Gestión de Técnicos</h2><p>Tabla de técnicos...</p>`, standalone: true })
export class TechniciansComponent {}


export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'clients', component: ClientsComponent },
      { path: 'elevators', component: ElevatorsComponent },
      { path: 'technicians', component: TechniciansComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
