import { Routes } from '@angular/router';
import { WorkerLayoutComponent } from './layout/worker-layout.component';

export const workerRoutes: Routes = [
  {
    path: '',
    component: WorkerLayoutComponent,
    children: [
      {
        path: 'profile',
        loadComponent: () => import('./profile/worker-profile.component').then(m => m.WorkerProfileComponent)
      },
      {
        path: 'routes',
        loadComponent: () => import('./routes/worker-routes.component').then(m => m.WorkerRoutesComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/list/worker-reports.component').then(m => m.WorkerReportsComponent)
      },
      {
        path: 'equipment',
        loadComponent: () => import('./equipment/worker-equipment.component').then(m => m.WorkerEquipmentComponent)
      },
      { path: '', redirectTo: 'profile', pathMatch: 'full' }
    ]
  }
];
