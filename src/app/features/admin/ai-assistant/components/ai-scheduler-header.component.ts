import { Component, Input, Output, EventEmitter } from '@angular/core';
import type { DemandInfo, TecnicoConCarga } from '../../models/ia-scheduler.interface';

@Component({
  selector: 'app-ai-scheduler-header',
  standalone: true,
  template: `
    <div class="flex flex-col gap-4 p-4 border-b border-gray-200 bg-white">
      <!-- Fila: Fecha + Badge de demanda -->
      <div class="flex items-center gap-3 flex-wrap">
        <label class="text-sm font-medium text-gray-700" for="fecha-input">Fecha:</label>
        <input
          id="fecha-input"
          type="date"
          [value]="fecha"
          [min]="tomorrowStr"
          (change)="onFechaChange($event)"
          [disabled]="disabled"
          class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        @if (demandaInfo) {
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span class="text-base">📋</span>
            {{ demandaInfo.total }} trabajos pendientes
          </span>
        }
        @if (demandaInfo && demandaInfo.total === 0) {
          <span class="text-sm text-amber-600 font-medium">
            ⚠ No hay trabajos pendientes para esta fecha
          </span>
        }
      </div>

      <!-- Técnicos: chips toggle -->
      <div>
        <p class="text-sm font-medium text-gray-700 mb-2">Técnicos disponibles:</p>
        <div class="flex flex-wrap gap-2">
          @for (tecnico of tecnicosDisponibles; track tecnico.trabajador_id) {
            <button
              type="button"
              (click)="toggleTecnico(tecnico.trabajador_id)"
              [class]="chipClass(tecnico.trabajador_id)"
              [disabled]="disabled"
            >
              <span class="font-medium">{{ tecnico.nombre }} {{ tecnico.apellido }}</span>
              <span class="text-xs opacity-75 ml-1">
                ({{ tecnico.especialidad }})
              </span>
              @if (tecnico.carga_preexistente.trabajos_confirmados > 0) {
                <span class="text-xs opacity-60 ml-1">
                  — {{ tecnico.carga_preexistente.trabajos_confirmados }} ya asignados
                </span>
              }
            </button>
          }
          @if (tecnicosDisponibles.length === 0) {
            <span class="text-sm text-gray-400 italic">No hay técnicos disponibles para esta fecha</span>
          }
        </div>
      </div>

      <!-- Botón Generar -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          (click)="onGenerar()"
          [disabled]="!puedeGenerar() || disabled"
          class="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors duration-200
                 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
        >
          @if (disabled) {
            <span class="inline-flex items-center gap-2">
              <span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              Generando...
            </span>
          } @else {
            Generar propuesta
          }
        </button>
        @if (selectedTecnicos.length === 0 && !disabled) {
          <span class="text-xs text-gray-400 italic">
            Seleccioná al menos un técnico para generar la propuesta
          </span>
        }
      </div>
    </div>
  `,
})
export class AiSchedulerHeaderComponent {
  @Input() fecha = '';
  @Input() demandaInfo: DemandInfo | null = null;
  @Input() tecnicosDisponibles: TecnicoConCarga[] = [];
  @Input() selectedTecnicos: number[] = [];
  @Input() disabled = false;

  @Output() fechaChange = new EventEmitter<string>();
  @Output() tecnicoToggle = new EventEmitter<number>();
  @Output() generar = new EventEmitter<void>();

  get tomorrowStr(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  onFechaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fechaChange.emit(input.value);
  }

  toggleTecnico(id: number): void {
    this.tecnicoToggle.emit(id);
  }

  onGenerar(): void {
    this.generar.emit();
  }

  puedeGenerar(): boolean {
    return this.selectedTecnicos.length > 0;
  }

  chipClass(tecnicoId: number): string {
    const selected = this.selectedTecnicos.includes(tecnicoId);
    const base =
      'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1';
    if (selected) {
      return `${base} bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500`;
    }
    return `${base} bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400 focus:ring-gray-400 disabled:opacity-50`;
  }
}
