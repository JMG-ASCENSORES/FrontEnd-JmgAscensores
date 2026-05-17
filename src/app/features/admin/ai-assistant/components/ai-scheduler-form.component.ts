import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Client } from '../../services/client.service';
import type { Elevator } from '../../../../core/models/elevator.model';
import type { TipoTrabajo } from '../../models/ia-scheduler.interface';

export interface FormValues {
  fecha: string;
  clienteId: number | null;
  ascensorId: number | null;
  tipo: TipoTrabajo;
  horaPreferida: string;
}

@Component({
  selector: 'app-ai-scheduler-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-4 border-b border-gray-200 bg-white space-y-4">
      <h2 class="text-sm font-semibold text-gray-800 uppercase tracking-wide">Nuevo trabajo</h2>

      <!-- Fecha -->
      <div class="flex items-center gap-3 flex-wrap">
        <label class="text-sm font-medium text-gray-700 w-28 flex-shrink-0" for="sched-fecha">Fecha:</label>
        <input
          id="sched-fecha"
          type="date"
          [ngModel]="fecha"
          (ngModelChange)="fechaChange.emit($event)"
          [min]="tomorrowStr"
          [disabled]="disabled"
          class="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <!-- Cliente -->
      <div class="flex items-center gap-3 flex-wrap">
        <label class="text-sm font-medium text-gray-700 w-28 flex-shrink-0" for="sched-cliente">Cliente:</label>
        <select
          id="sched-cliente"
          [ngModel]="clienteId"
          (ngModelChange)="clienteChange.emit($event ? +$event : null)"
          [disabled]="disabled || clientes.length === 0"
          class="border border-gray-300 rounded px-2 py-1.5 text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option [value]="null">-- Seleccionar cliente --</option>
          @for (c of clientes; track c.cliente_id) {
            <option [value]="c.cliente_id">{{ c.nombre_comercial }}</option>
          }
        </select>
      </div>

      <!-- Ascensor (filtrado por cliente) -->
      <div class="flex items-center gap-3 flex-wrap">
        <label class="text-sm font-medium text-gray-700 w-28 flex-shrink-0" for="sched-ascensor">Equipo:</label>
        <select
          id="sched-ascensor"
          [ngModel]="ascensorId"
          (ngModelChange)="ascensorChange.emit($event ? +$event : null)"
          [disabled]="disabled || !clienteId || ascensores.length === 0"
          class="border border-gray-300 rounded px-2 py-1.5 text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option [value]="null">-- Seleccionar equipo --</option>
          @for (a of ascensores; track a.ascensor_id) {
            <option [value]="a.ascensor_id">
              {{ a.tipo_equipo }}{{ a.marca ? ' — ' + a.marca : '' }}{{ a.modelo ? ' ' + a.modelo : '' }}
            </option>
          }
        </select>
        @if (clienteId && ascensores.length === 0) {
          <span class="text-xs text-gray-400 italic">Sin equipos registrados</span>
        }
      </div>

      <!-- Tipo de trabajo -->
      <div class="flex items-center gap-3 flex-wrap">
        <label class="text-sm font-medium text-gray-700 w-28 flex-shrink-0" for="sched-tipo">Tipo:</label>
        <select
          id="sched-tipo"
          [ngModel]="tipo"
          (ngModelChange)="tipoChange.emit($event)"
          [disabled]="disabled"
          class="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="mantenimiento">Mantenimiento</option>
          <option value="reparacion">Reparación</option>
          <option value="inspeccion">Inspección</option>
          <option value="emergencia">Emergencia</option>
        </select>
      </div>

      <!-- Hora preferida (opcional) -->
      <div class="flex items-center gap-3 flex-wrap">
        <label class="text-sm font-medium text-gray-700 w-28 flex-shrink-0" for="sched-hora">Hora preferida:</label>
        <input
          id="sched-hora"
          type="time"
          [ngModel]="horaPreferida"
          (ngModelChange)="horaChange.emit($event)"
          [disabled]="disabled"
          min="08:30"
          max="18:00"
          class="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span class="text-xs text-gray-400">(opcional)</span>
      </div>

      <!-- Botón generar -->
      <div class="flex items-center gap-3 pt-1">
        <button
          type="button"
          (click)="onGenerar()"
          [disabled]="!puedeGenerar() || disabled"
          class="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors duration-200
                 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          @if (disabled) {
            <span class="inline-flex items-center gap-2">
              <span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              Buscando técnico...
            </span>
          } @else {
            Buscar técnico óptimo
          }
        </button>
        @if (!puedeGenerar() && !disabled) {
          <span class="text-xs text-gray-400 italic">Seleccioná cliente y equipo para continuar</span>
        }
      </div>
    </div>
  `,
})
export class AiSchedulerFormComponent implements OnChanges {
  @Input() fecha = '';
  @Input() clienteId: number | null = null;
  @Input() ascensorId: number | null = null;
  @Input() tipo: TipoTrabajo = 'mantenimiento';
  @Input() horaPreferida = '';
  @Input() clientes: Client[] = [];
  @Input() ascensores: Elevator[] = [];
  @Input() disabled = false;

  @Output() fechaChange = new EventEmitter<string>();
  @Output() clienteChange = new EventEmitter<number | null>();
  @Output() ascensorChange = new EventEmitter<number | null>();
  @Output() tipoChange = new EventEmitter<TipoTrabajo>();
  @Output() horaChange = new EventEmitter<string>();
  @Output() generar = new EventEmitter<void>();

  get tomorrowStr(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteId'] && !changes['clienteId'].currentValue) {
      this.ascensorChange.emit(null);
    }
  }

  puedeGenerar(): boolean {
    return !!this.clienteId && !!this.ascensorId;
  }

  onGenerar(): void {
    if (this.puedeGenerar()) {
      this.generar.emit();
    }
  }
}
