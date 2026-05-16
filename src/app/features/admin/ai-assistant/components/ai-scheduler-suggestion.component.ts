import { Component, Input, Output, EventEmitter } from '@angular/core';
import type { SugerenciaResponse, SlotSugerido, SchedulerState } from '../../models/ia-scheduler.interface';

@Component({
  selector: 'app-ai-scheduler-suggestion',
  standalone: true,
  template: `
    <div class="p-4 space-y-4">

      <!-- Banner: validación IA no disponible -->
      @if (sugerencia?.origen === 'motor_fallback') {
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-sm text-amber-700 font-medium">
            ⚠ Sugerencia generada sin validación IA — el servicio no está disponible.
          </p>
        </div>
      }

      <!-- Banner: correcciones automáticas -->
      @if (sugerencia?.advertencias && sugerencia!.advertencias!.length > 0) {
        <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-sm text-yellow-700 font-medium mb-1">⚠ La IA hizo correcciones automáticas:</p>
          <ul class="list-disc list-inside text-sm text-yellow-600 space-y-0.5">
            @for (adv of sugerencia!.advertencias; track $index) {
              <li>{{ adv }}</li>
            }
          </ul>
        </div>
      }

      <!-- Sin técnico elegible -->
      @if (sugerencia?.sin_elegible) {
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="font-medium text-red-700">
            🚫 Ningún técnico disponible puede realizar este tipo de trabajo
          </p>
          @if (sugerencia?.razon_sin_elegible) {
            <p class="text-sm text-red-600 mt-1">{{ sugerencia!.razon_sin_elegible }}</p>
          }
        </div>
      }

      <!-- Trabajo solicitado (contexto) -->
      @if (sugerencia?.trabajo) {
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Trabajo solicitado</p>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span class="font-medium text-gray-800">{{ sugerencia!.trabajo.nombre_cliente }}</span>
            <span class="text-gray-500">{{ sugerencia!.trabajo.distrito }}</span>
            <span class="text-gray-500">{{ sugerencia!.trabajo.tipo_equipo }}</span>
            <span [class]="tipoBadgeClass(sugerencia!.trabajo.tipo_trabajo)"
                  class="px-2 py-0.5 rounded-full text-xs font-medium">
              {{ sugerencia!.trabajo.tipo_trabajo }}
            </span>
            <span class="text-gray-400">{{ sugerencia!.trabajo.duracion_min }}min</span>
            @if (sugerencia!.trabajo.hora_preferida) {
              <span class="text-gray-400">preferida: {{ sugerencia!.trabajo.hora_preferida }}</span>
            }
          </div>
        </div>
      }

      <!-- Sugerencia principal -->
      @if (sugerencia?.sugerencia) {
        <div class="bg-green-50 border border-green-300 rounded-lg p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="text-green-600 font-bold text-base">✓</span>
                <span class="font-semibold text-gray-900">
                  {{ sugerencia!.sugerencia!.nombre }} {{ sugerencia!.sugerencia!.apellido }}
                </span>
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {{ sugerencia!.sugerencia!.especialidad }}
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-3 text-sm mb-2">
                <span class="font-mono font-medium text-gray-800">
                  {{ sugerencia!.sugerencia!.hora_inicio }} – {{ sugerencia!.sugerencia!.hora_fin }}
                </span>
                @if (sugerencia!.sugerencia!.traslado_min > 0) {
                  <span class="text-gray-400 text-xs">
                    +{{ sugerencia!.sugerencia!.traslado_min }}min traslado
                  </span>
                }
                <span class="text-gray-400 text-xs">
                  {{ sugerencia!.sugerencia!.carga_previa_horas.toFixed(1) }}h previas
                </span>
              </div>

              @if (sugerencia!.sugerencia!.justificacion) {
                <p class="text-sm text-gray-600 italic border-l-2 border-green-300 pl-3 leading-relaxed">
                  "{{ sugerencia!.sugerencia!.justificacion }}"
                </p>
              }
            </div>

            <button
              type="button"
              (click)="confirmar.emit(sugerencia!.sugerencia!)"
              [disabled]="state === 'confirming'"
              class="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600
                     hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              @if (state === 'confirming') {
                <span class="inline-flex items-center gap-1.5">
                  <span class="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full inline-block"></span>
                  Aplicando...
                </span>
              } @else {
                Confirmar
              }
            </button>
          </div>
        </div>
      }

      <!-- Alternativas -->
      @if (sugerencia?.alternativas && sugerencia!.alternativas.length > 0) {
        <div>
          <p class="text-sm font-medium text-gray-600 mb-2">Otras opciones:</p>
          <div class="space-y-2">
            @for (alt of sugerencia!.alternativas; track alt.trabajador_id) {
              <div class="bg-white border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3 hover:border-gray-300 transition-colors">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-gray-800 text-sm">
                      {{ alt.nombre }} {{ alt.apellido }}
                    </span>
                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {{ alt.especialidad }}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span class="font-mono font-medium text-gray-700">{{ alt.hora_inicio }} – {{ alt.hora_fin }}</span>
                    @if (alt.traslado_min > 0) {
                      <span>+{{ alt.traslado_min }}min traslado</span>
                    }
                    <span>{{ alt.carga_previa_horas.toFixed(1) }}h previas</span>
                  </div>
                  @if (alt.justificacion) {
                    <p class="text-xs text-gray-400 italic mt-1 line-clamp-2">{{ alt.justificacion }}</p>
                  }
                </div>
                <button
                  type="button"
                  (click)="confirmar.emit(alt)"
                  [disabled]="state === 'confirming'"
                  class="flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium text-blue-600
                         border border-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none"
                >
                  Elegir
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Notas del LLM -->
      @if (sugerencia?.notas_llm) {
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-sm text-blue-700 italic">💡 {{ sugerencia!.notas_llm }}</p>
        </div>
      }

      <!-- Botón descartar -->
      <div class="pt-1">
        <button
          type="button"
          (click)="descartar.emit()"
          class="text-sm text-gray-400 underline hover:text-gray-600 focus:outline-none transition-colors"
        >
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
      emergencia:    'bg-red-100 text-red-700',
      reparacion:    'bg-orange-100 text-orange-700',
      inspeccion:    'bg-yellow-100 text-yellow-700',
      mantenimiento: 'bg-blue-100 text-blue-700',
    };
    return map[tipo] ?? 'bg-gray-100 text-gray-700';
  }
}
