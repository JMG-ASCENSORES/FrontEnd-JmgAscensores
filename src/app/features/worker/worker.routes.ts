import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { WorkerLayoutComponent } from './layout/worker-layout.component';

// Placeholder components
@Component({ template: `<h2 class="text-lg font-bold">Mis Asignaciones</h2><p>Lista de tareas para hoy...</p>`, standalone: true })
export class WorkerHomeComponent {}

@Component({ template: `<h2 class="text-lg font-bold">Mis Rutas</h2><p>Mapa y paradas...</p>`, standalone: true })
export class WorkerRoutesComponent {}

@Component({ template: `<h2 class="text-lg font-bold">Mi Perfil</h2><p>Información del técnico...</p>`, standalone: true })
export class WorkerProfileComponent {}

export const workerRoutes: Routes = [
  {
    path: '',
    component: WorkerLayoutComponent,
    children: [
      { path: 'home', component: WorkerHomeComponent },
      { path: 'routes', component: WorkerRoutesComponent },
      { path: 'profile', component: WorkerProfileComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];
