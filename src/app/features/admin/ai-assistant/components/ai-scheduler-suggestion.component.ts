import { Component, Input, Output, EventEmitter } from '@angular/core';
import type { SugerenciaResponse, SlotSugerido, SchedulerState } from '../../models/ia-scheduler.interface';

@Component({
  selector: 'app-ai-scheduler-suggestion',
  standalone: true,
  template: `
    <div class="space-y-4">
      <!-- Fallback banner -->
      @if (sugerencia?.origen === 'motor_fallback') {
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p class="text-sm font-medium text-amber-700">⚠ Sugerencia base del motor — validación IA no disponible.</p>
        </div>
      }

      <!-- Advertencias -->
      @if (sugerencia?.advertencias && sugerencia!.advertencias!.length > 0) {
        <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p class="text-sm font-semibold text-yellow-700 mb-1">⚠ Correcciones automáticas:</p>
          <ul class="list-disc list-inside text-sm text-yellow-600 space-y-0.5">
            @for (adv of sugerencia!.advertencias; track $index) { <li>{{ adv }}</li> }
          </ul>
        </div>
      }

      <!-- Sin elegible -->
      @if (sugerencia?.sin_elegible) {
        <div class="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <span class="text-xl">🚫</span>
            </div>
            <div>
              <p class="font-semibold text-red-700">Ningún técnico disponible</p>
              @if (sugerencia?.razon_sin_elegible) {
                <p class="text-sm text-red-600 mt-1">{{ sugerencia!.razon_sin_elegible }}</p>
              }
            </div>
          </div>
        </div>
      }

      <!-- Trabajo solicitado -->
      @if (sugerencia?.trabajo) {
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Trabajo</span>
            <span [class]="tipoBadgeClass(sugerencia!.trabajo.tipo_trabajo)"
                  class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide">
              {{ sugerencia!.trabajo.tipo_trabajo }}
            </span>
            <span class="text-xs text-slate-400">{{ sugerencia!.trabajo.duracion_min }}min</span>
          </div>
          <p class="text-sm font-semibold text-slate-800">{{ sugerencia!.trabajo.nombre_cliente }}</p>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ sugerencia!.trabajo.distrito }} · {{ sugerencia!.trabajo.tipo_equipo }}
            @if (sugerencia!.trabajo.hora_preferida) { · preferida {{ sugerencia!.trabajo.hora_preferida }} }
          </p>
        </div>
      }

      <!-- Sugerencia principal -->
      @if (sugerencia?.sugerencia) {
        <div class="bg-white rounded-2xl border-2 border-emerald-300 shadow-md shadow-emerald-100 overflow-hidden">
          <!-- Green accent bar -->
          <div class="h-1 bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
          <div class="p-5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <span class="text-emerald-500 font-bold text-lg">✓</span>
                  <span class="text-base font-bold text-slate-800 font-display">
                    {{ sugerencia!.sugerencia!.nombre }} {{ sugerencia!.sugerencia!.apellido }}
                  </span>
                  <span class="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {{ sugerencia!.sugerencia!.especialidad }}
                  </span>
                </div>

                <!-- Time block -->
                <div class="flex items-center gap-2 mb-3">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100">
                    <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span class="text-sm font-mono font-semibold text-slate-700">{{ sugerencia!.sugerencia!.hora_inicio }} – {{ sugerencia!.sugerencia!.hora_fin }}</span>
                  </span>
                  @if (sugerencia!.sugerencia!.traslado_min > 0) {
                    <span class="text-xs text-slate-400">+{{ sugerencia!.sugerencia!.traslado_min }}min</span>
                  }
                  <span class="text-xs text-slate-400">{{ sugerencia!.sugerencia!.carga_previa_horas.toFixed(1) }}h previas</span>
                </div>

                @if (sugerencia!.sugerencia!.justificacion) {
                  <div class="bg-emerald-50/50 border-l-2 border-emerald-300 rounded-r-lg pl-3 py-2">
                    <p class="text-sm text-slate-600 italic leading-relaxed">"{{ sugerencia!.sugerencia!.justificacion }}"</p>
                  </div>
                }
              </div>

              <button
                type="button"
                (click)="confirmar.emit(sugerencia!.sugerencia!)"
                [disabled]="state === 'confirming' || state === 'adjusting'"
                class="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                       bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20
                       disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none
                       transition-all active:scale-[0.98]">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                @if (state === 'confirming') { Aplicando... }
                @else { Confirmar }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Alternativas -->
      @if (sugerencia?.alternativas && sugerencia!.alternativas.length > 0) {
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Otras opciones</p>
          <div class="space-y-2.5">
            @for (alt of sugerencia!.alternativas; track alt.trabajador_id) {
              <div class="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100
                          hover:border-slate-200 hover:shadow-sm transition-all group">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-semibold text-slate-700">{{ alt.nombre }} {{ alt.apellido }}</span>
                    <span class="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{{ alt.especialidad }}</span>
                  </div>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="text-xs font-mono font-medium text-slate-600">{{ alt.hora_inicio }} – {{ alt.hora_fin }}</span>
                    @if (alt.traslado_min > 0) { <span class="text-xs text-slate-400">+{{ alt.traslado_min }}min</span> }
                    <span class="text-xs text-slate-400">{{ alt.carga_previa_horas.toFixed(1) }}h previas</span>
                  </div>
                  @if (alt.justificacion) {
                    <p class="text-xs text-slate-400 italic mt-1 line-clamp-2">{{ alt.justificacion }}</p>
                  }
                </div>
                <button
                  type="button"
                  (click)="confirmar.emit(alt)"
                  [disabled]="state === 'confirming' || state === 'adjusting'"
                  class="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#003B73]
                         border border-[#003B73]/30 hover:bg-[#003B73]/5
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all
                         opacity-0 group-hover:opacity-100">
                  Elegir
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Notas LLM -->
      @if (sugerencia?.notas_llm) {
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div class="flex items-start gap-2">
            <span class="text-blue-400 mt-0.5">💡</span>
            <p class="text-sm text-blue-700 italic">{{ sugerencia!.notas_llm }}</p>
          </div>
        </div>
      }

      <!-- Descartar -->
      <div class="text-center pt-1">
        <button type="button" (click)="descartar.emit()"
                class="text-xs text-slate-400 underline hover:text-slate-600 transition-colors">
          Cancelar y volver al formulario
        </button>
      </div>
    </div>
  `,
})
export class AiSchedulerSuggestionComponent {
  @Input() sugerencia: SugerenciaResponse | null = null;
  @Input() state: SchedulerState = 'sugerencia_lista';

  @Output() confirmar = new EventEmitter<SlotSugerido>();
  @Output() descartar = new EventEmitter<void>();

  tipoBadgeClass(tipo: string): string {
    const map: Record<string, string> = {
      emergencia: 'bg-red-100 text-red-700',
      reparacion: 'bg-orange-100 text-orange-700',
      inspeccion: 'bg-yellow-100 text-yellow-700',
      mantenimiento: 'bg-blue-100 text-blue-700',
    };
    return map[tipo] ?? 'bg-slate-100 text-slate-600';
  }
}
