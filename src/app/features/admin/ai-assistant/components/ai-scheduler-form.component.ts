import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Client } from '../../services/client.service';
import type { Elevator } from '../../../../core/models/elevator.model';
import type { TipoTrabajo } from '../../models/ia-scheduler.interface';

@Component({
  selector: 'app-ai-scheduler-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-5">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#003B73] to-[#001f3f] flex items-center justify-center shadow-md shadow-[#003B73]/20">
          <svg class="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </div>
        <h2 class="text-lg font-bold text-slate-800 font-display">Nuevo trabajo</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Fecha -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Fecha</label>
          <input
            type="date"
            [ngModel]="fecha"
            (ngModelChange)="fechaChange.emit($event)"
            [min]="tomorrowStr"
            [disabled]="disabled"
            class="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700
                   focus:bg-white focus:border-jmg focus:ring-2 focus:ring-jmg/10 transition-all outline-none
                   disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <!-- Hora preferida -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Hora preferida <span class="text-slate-400 font-normal normal-case tracking-normal">(opcional)</span>
          </label>
          <input
            type="time"
            [ngModel]="horaPreferida"
            (ngModelChange)="horaChange.emit($event)"
            [disabled]="disabled"
            min="08:30" max="18:00"
            class="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700
                   focus:bg-white focus:border-jmg focus:ring-2 focus:ring-jmg/10 transition-all outline-none
                   disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <!-- Cliente -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cliente</label>
          <select
            [ngModel]="clienteId"
            (ngModelChange)="clienteChange.emit($event ? +$event : null)"
            [disabled]="disabled || clientes.length === 0"
            class="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700
                   focus:bg-white focus:border-jmg focus:ring-2 focus:ring-jmg/10 transition-all outline-none
                   disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
            style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 fill=%22%2394A3B8%22><path d=%22M6 8L1 3h10z%22/></svg>'); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;"
          >
            <option [ngValue]="null" disabled>Seleccionar cliente...</option>
            @for (c of clientes; track c.cliente_id) {
              <option [ngValue]="c.cliente_id">{{ c.nombre_comercial }}</option>
            }
          </select>
        </div>

        <!-- Ascensor -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Equipo</label>
          <select
            [ngModel]="ascensorId"
            (ngModelChange)="ascensorChange.emit($event ? +$event : null)"
            [disabled]="disabled || !clienteId || ascensores.length === 0"
            class="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700
                   focus:bg-white focus:border-jmg focus:ring-2 focus:ring-jmg/10 transition-all outline-none
                   disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
            style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 fill=%22%2394A3B8%22><path d=%22M6 8L1 3h10z%22/></svg>'); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;"
          >
            <option [ngValue]="null" disabled>Seleccionar equipo...</option>
            @for (a of ascensores; track a.ascensor_id) {
              <option [ngValue]="a.ascensor_id">{{ a.tipo_equipo }}{{ a.marca ? ' — ' + a.marca : '' }}</option>
            }
          </select>
          @if (clienteId && ascensores.length === 0) {
            <p class="text-xs text-slate-400 mt-1">Sin equipos registrados</p>
          }
        </div>

        <!-- Tipo de trabajo -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de trabajo</label>
          <div class="grid grid-cols-2 gap-2">
            @for (tipoOption of tipos; track tipoOption.value) {
              <button
                type="button"
                (click)="tipoChange.emit(tipoOption.value)"
                [disabled]="disabled"
                [class]="tipo === tipoOption.value
                  ? tipoOption.activeClass + ' border-transparent shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'"
                class="px-3 py-2 rounded-xl border text-xs font-semibold transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed text-center">
                {{ tipoOption.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Botón generar -->
      <div class="flex items-center gap-3 pt-1">
        <button
          type="button"
          (click)="onGenerar()"
          [disabled]="!puedeGenerar() || disabled"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white
                 bg-[#003B73] hover:bg-[#001f3f] shadow-lg shadow-[#003B73]/20
                 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none
                 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-jmg/30 focus:ring-offset-2"
        >
          @if (disabled) {
            <span class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>
            Buscando...
          } @else {
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Buscar técnico óptimo
          }
        </button>
        @if (!puedeGenerar() && !disabled) {
          <span class="text-xs text-slate-400">Seleccioná cliente y equipo</span>
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

  tipos: { value: TipoTrabajo; label: string; activeClass: string }[] = [
    { value: 'mantenimiento', label: 'Mantenimiento', activeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'reparacion',    label: 'Reparación',    activeClass: 'bg-orange-50 text-orange-700 border-orange-200' },
    { value: 'inspeccion',    label: 'Inspección',    activeClass: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { value: 'emergencia',    label: 'Emergencia',    activeClass: 'bg-red-50 text-red-700 border-red-200' },
  ];

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
