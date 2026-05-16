import { Component, Input, Output, EventEmitter } from '@angular/core';
import type { DemandResponse, MantenimientoVencido } from '../../models/ia-scheduler.interface';

@Component({
  selector: 'app-ai-scheduler-demand-context',
  standalone: true,
  template: `
    @if (demanda && demanda.total > 0) {
      <div class="px-4 py-3 border-b border-amber-200 bg-amber-50">
        <p class="text-sm font-medium text-amber-800 mb-2">
          📋 {{ demanda.total }} mantenimiento{{ demanda.total > 1 ? 's' : '' }} vence{{ demanda.total > 1 ? 'n' : '' }} esta fecha
        </p>
        <div class="space-y-1.5">
          @for (item of demanda.trabajos; track item.mantenimiento_fijo_id) {
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-amber-700 min-w-0 truncate">
                <span class="font-medium">{{ item.nombre_cliente }}</span>
                <span class="text-amber-500 ml-1">— {{ item.distrito }}</span>
                <span class="text-amber-500 ml-1">— {{ item.tipo_equipo }}</span>
                @if (item.hora_preferida) {
                  <span class="text-amber-400 ml-1">({{ item.hora_preferida }})</span>
                }
              </span>
              <button
                type="button"
                (click)="prellenar.emit(item)"
                class="text-xs text-blue-600 underline hover:text-blue-800 whitespace-nowrap flex-shrink-0 focus:outline-none"
              >
                Programar
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class AiSchedulerDemandContextComponent {
  @Input() demanda: DemandResponse | null = null;
  @Output() prellenar = new EventEmitter<MantenimientoVencido>();
}
