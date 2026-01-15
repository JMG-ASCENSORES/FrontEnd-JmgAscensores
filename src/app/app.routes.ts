import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard'; // Will define next

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'worker',
    loadChildren: () => import('./features/worker/worker.routes').then(m => m.workerRoutes),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'auth'
  }
];
