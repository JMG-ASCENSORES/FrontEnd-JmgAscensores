import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-worker-routes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:12px;color:#94a3b8;">
      <i class="bi bi-geo-alt" style="font-size:48px;"></i>
      <p style="font-weight:600;font-size:16px;">Rutas</p>
      <p style="font-size:13px;">Próximamente disponible</p>
    </div>
  `
})
export class WorkerRoutesComponent {}
