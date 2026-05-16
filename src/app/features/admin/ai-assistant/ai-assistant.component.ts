import { Component, OnInit, signal, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AiSchedulerHeaderComponent } from './components/ai-scheduler-header.component';
import { IaSchedulerService } from '../../../core/services/ia-scheduler.service';
import type {
  SchedulerState,
  DemandInfo,
  TecnicoConCarga,
  Propuesta,
} from '../models/ia-scheduler.interface';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [AiSchedulerHeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header: selector fecha + chips técnicos + botón generar -->
      <app-ai-scheduler-header
        [fecha]="selectedDate()"
        [demandaInfo]="demandaInfo()"
        [tecnicosDisponibles]="tecnicosDisponibles()"
        [selectedTecnicos]="selectedTecnicos()"
        [disabled]="state() === 'loading' || state() === 'adjusting' || state() === 'confirming'"
        (fechaChange)="onFechaChange($event)"
        (tecnicoToggle)="onTecnicoToggle($event)"
        (generar)="onGenerarPropuesta()"
      />

      <!-- Estado de error -->
      @if (errorMessage()) {
        <div class="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700 font-medium">{{ errorMessage() }}</p>
          <button
            type="button"
            (click)="errorMessage.set(null)"
            class="mt-2 text-xs text-red-600 underline hover:text-red-800"
          >
            Cerrar
          </button>
        </div>
      }

      <!-- Spinner de carga -->
      @if (state() === 'loading') {
        <div class="flex flex-col items-center justify-center py-16 text-gray-500">
          <div class="animate-spin inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p class="text-base font-medium">Generando propuesta con IA...</p>
          <p class="text-sm text-gray-400 mt-1">Esto puede tardar unos segundos</p>
        </div>
      }

      <!-- Área de propuesta (timeline placeholder — Fase 5) -->
      @if (state() === 'propuesta_lista' && propuestaActual()) {
        <div class="p-4 space-y-4">
          <!-- Banner de origen -->
          @if (propuestaActual()!.origen === 'motor_fallback') {
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p class="text-sm text-amber-700 font-medium">
                ⚠ Propuesta generada sin validación IA — el servicio no está disponible.
              </p>
            </div>
          }

          <!-- Banner de advertencias -->
          @if (propuestaActual()!.advertencias && propuestaActual()!.advertencias!.length > 0) {
            <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="text-sm text-yellow-700 font-medium mb-1">⚠ Advertencias de la generación:</p>
              <ul class="list-disc list-inside text-sm text-yellow-600 space-y-0.5">
                @for (adv of propuestaActual()!.advertencias; track $index) {
                  <li>{{ adv }}</li>
                }
              </ul>
            </div>
          }

          <!-- Resumen por técnico (timeline placeholder — se completa en Fase 5) -->
          @for (tecnico of propuestaActual()!.tecnicos; track tecnico.trabajador_id) {
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="font-medium text-gray-900">
                  {{ tecnico.nombre }} {{ tecnico.apellido }}
                </span>
                <span class="text-sm text-gray-500">— {{ tecnico.especialidad }}</span>
                <span class="text-sm font-medium text-blue-600 ml-auto">
                  {{ tecnico.carga_horas.toFixed(1) }}h asignadas
                </span>
              </div>

              <!-- Lista de trabajos (versión simple, Fase 5 agrega timeline visual) -->
              <div class="space-y-1.5">
                @for (trabajo of tecnico.trabajos; track trabajo.programacion_id ?? trabajo.mantenimiento_fijo_id ?? $index) {
                  <div class="flex items-start gap-2 text-sm py-1.5 px-2 rounded hover:bg-gray-50">
                    <span class="w-12 text-gray-500 font-mono flex-shrink-0">{{ trabajo.hora_inicio }}</span>
                    <span [class]="dotClass(trabajo.tipo_trabajo)" class="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"></span>
                    <div class="flex-1 min-w-0">
                      <span class="font-medium text-gray-800">{{ trabajo.nombre_cliente }}</span>
                      <span class="text-gray-400 ml-1.5">{{ trabajo.distrito }}</span>
                      <span class="text-gray-400 ml-1.5">{{ trabajo.duracion_min }}min</span>
                      @if (trabajo.traslado_desde_anterior > 0) {
                        <span class="text-gray-300 ml-1.5">(+{{ trabajo.traslado_desde_anterior }}min traslado)</span>
                      }
                      @if (trabajo.justificacion) {
                        <p class="text-gray-400 text-xs mt-0.5 italic truncate">{{ trabajo.justificacion }}</p>
                      }
                    </div>
                    <span class="font-mono text-gray-400 flex-shrink-0">{{ trabajo.hora_fin }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Overflow -->
          @if (propuestaActual()!.overflow.length > 0) {
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p class="font-medium text-amber-800 mb-2">
                ⚠ {{ propuestaActual()!.overflow.length }} trabajo(s) no asignado(s)
              </p>
              @for (item of propuestaActual()!.overflow; track item.programacion_id ?? $index) {
                <div class="text-sm text-amber-700 ml-4">
                  • {{ item.nombre_cliente }} ({{ item.distrito }}) — {{ item.tipo_trabajo }}
                  @if (item.razon_overflow) {
                    <span class="text-amber-600"> — {{ item.razon_overflow }}</span>
                  }
                </div>
              }
              @if (propuestaActual()!.notas_overflow) {
                <p class="text-sm text-amber-600 mt-2 italic">
                  💡 IA sugiere: {{ propuestaActual()!.notas_overflow }}
                </p>
              }
            </div>
          }

          <!-- Sin elegible -->
          @if (propuestaActual()!.sin_elegible.length > 0) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="font-medium text-red-700 mb-2">
                🚫 {{ propuestaActual()!.sin_elegible.length }} trabajo(s) sin técnico elegible
              </p>
              @for (item of propuestaActual()!.sin_elegible; track item.programacion_id ?? item.mantenimiento_fijo_id ?? $index) {
                <div class="text-sm text-red-600 ml-4">
                  • {{ item.nombre_cliente }} ({{ item.distrito }}) — {{ item.tipo_trabajo }}
                </div>
              }
            </div>
          }

          <!-- Footer placeholder (Fase 5 implementa botones confirmar/descartar) -->
          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="onDescartar()"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Descartar propuesta
            </button>
            <button
              type="button"
              [disabled]="state() === 'confirming'"
              class="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              @if (state() === 'confirming') {
                Aplicando...
              } @else {
                Confirmar y crear programaciones
              }
            </button>
          </div>
        </div>
      }

      <!-- Estado confirmado -->
      @if (state() === 'confirmado') {
        <div class="flex flex-col items-center justify-center py-16">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span class="text-2xl">✅</span>
          </div>
          <p class="text-lg font-semibold text-green-700">¡Propuesta confirmada!</p>
          <p class="text-sm text-green-600 mt-1">Las programaciones fueron creadas exitosamente.</p>
        </div>
      }
    </div>
  `,
})
export class AIAssistantComponent implements OnInit {
  private service = inject(IaSchedulerService);

  // ============= State Signals =============
  state = signal<SchedulerState>('idle');
  selectedDate = signal<string>(this.getTomorrow());
  selectedTecnicos = signal<number[]>([]);
  propuestaActual = signal<Propuesta | null>(null);
  demandaInfo = signal<DemandInfo | null>(null);
  tecnicosDisponibles = signal<TecnicoConCarga[]>([]);
  errorMessage = signal<string | null>(null);

  // ============= Lifecycle =============

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ============= Event Handlers =============

  onFechaChange(nuevaFecha: string): void {
    this.selectedDate.set(nuevaFecha);
    this.selectedTecnicos.set([]);
    this.propuestaActual.set(null);
    this.state.set('idle');
    this.cargarDatos();
  }

  onTecnicoToggle(tecnicoId: number): void {
    this.selectedTecnicos.update((ids) => {
      if (ids.includes(tecnicoId)) {
        return ids.filter((id) => id !== tecnicoId);
      }
      return [...ids, tecnicoId];
    });
  }

  onGenerarPropuesta(): void {
    if (this.selectedTecnicos().length === 0) return;

    this.errorMessage.set(null);
    this.state.set('loading');

    const body = {
      fecha: this.selectedDate(),
      tecnico_ids: this.selectedTecnicos(),
      instruccion_admin: null,
    };

    this.service.generar(body).subscribe({
      next: (propuesta) => {
        this.propuestaActual.set(propuesta);
        this.state.set('propuesta_lista');
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Error al generar la propuesta');
        this.state.set('idle');
      },
    });
  }

  onDescartar(): void {
    this.propuestaActual.set(null);
    this.state.set('idle');
    this.errorMessage.set(null);
  }

  // ============= Private Helpers =============

  private cargarDatos(): void {
    this.errorMessage.set(null);
    const fecha = this.selectedDate();

    forkJoin({
      demanda: this.service.getDemand(fecha),
      tecnicos: this.service.getTecnicos(fecha),
    }).subscribe({
      next: ({ demanda, tecnicos }) => {
        this.demandaInfo.set({
          fecha: demanda.fecha,
          total: demanda.total,
          por_tipo: demanda.por_tipo,
        });
        this.tecnicosDisponibles.set(tecnicos.tecnicos);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Error al cargar los datos iniciales');
      },
    });
  }

  private getTomorrow(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  dotClass(tipo: string): string {
    const map: Record<string, string> = {
      emergencia: 'bg-red-500',
      reparacion: 'bg-orange-500',
      inspeccion: 'bg-yellow-500',
      mantenimiento: 'bg-blue-500',
    };
    return map[tipo] || 'bg-gray-400';
  }
}
