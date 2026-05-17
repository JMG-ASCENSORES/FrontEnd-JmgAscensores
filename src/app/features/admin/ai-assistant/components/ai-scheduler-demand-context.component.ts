import { Component, Input, Output, EventEmitter } from '@angular/core';
import type { DemandResponse, MantenimientoVencido } from '../../models/ia-scheduler.interface';

@Component({
  selector: 'app-ai-scheduler-demand-context',
  standalone: true,
  template: `
    @if (demanda && demanda.total > 0) {
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg class="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-700 font-display">
                {{ demanda.total }} mantenimiento{{ demanda.total > 1 ? 's' : '' }} vence{{ demanda.total > 1 ? 'n' : '' }} esta fecha
              </p>
              <p class="text-[11px] text-slate-400">Click en Programar para pre-llenar el formulario</p>
            </div>
          </div>
        </div>
        <div class="p-4 space-y-2">
          @for (item of demanda.trabajos; track item.mantenimiento_fijo_id) {
            <div class="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-700 truncate">{{ item.nombre_cliente }}</p>
                <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>{{ item.distrito || 'Sin distrito' }}</span>
                  <span class="text-slate-300">·</span>
                  <span>{{ item.tipo_equipo }}</span>
                  @if (item.hora_preferida) {
                    <span class="text-slate-300">·</span>
                    <span class="text-amber-500 font-medium">{{ item.hora_preferida }}</span>
                  }
                </p>
              </div>
              <button
                type="button"
                (click)="prellenar.emit(item)"
                class="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#003B73]
                       border border-[#003B73]/20 hover:bg-[#003B73]/5 hover:border-[#003B73]/30
                       transition-all opacity-60 group-hover:opacity-100">
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
