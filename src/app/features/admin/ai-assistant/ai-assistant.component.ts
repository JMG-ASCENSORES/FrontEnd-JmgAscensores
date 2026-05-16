import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { IaSchedulerService } from '../../../core/services/ia-scheduler.service';
import { ClientService } from '../services/client.service';
import { ElevatorService } from '../services/elevator.service';
import { AiSchedulerFormComponent } from './components/ai-scheduler-form.component';
import { AiSchedulerDemandContextComponent } from './components/ai-scheduler-demand-context.component';
import { AiSchedulerSuggestionComponent } from './components/ai-scheduler-suggestion.component';
import type { Client } from '../services/client.service';
import type { Elevator } from '../../../core/models/elevator.model';
import type {
  SchedulerState,
  TipoTrabajo,
  DemandResponse,
  TecnicoConCarga,
  SugerenciaResponse,
  SlotSugerido,
  MantenimientoVencido,
} from '../models/ia-scheduler.interface';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    AiSchedulerFormComponent,
    AiSchedulerDemandContextComponent,
    AiSchedulerSuggestionComponent,
  ],
  template: `
    <div class="min-h-screen bg-gray-50">

      <!-- Header de página -->
      <div class="bg-white border-b border-gray-200 px-4 py-3">
        <h1 class="text-base font-semibold text-gray-900">Programador IA</h1>
        <p class="text-xs text-gray-400 mt-0.5">Definí un trabajo y la IA sugiere el técnico óptimo</p>
      </div>

      <!-- Formulario de trabajo -->
      @if (state() !== 'sugerencia_lista' && state() !== 'confirming' && state() !== 'confirmado') {
        <app-ai-scheduler-form
          [fecha]="selectedDate()"
          [clienteId]="selectedClienteId()"
          [ascensorId]="selectedAscensorId()"
          [tipo]="selectedTipo()"
          [horaPreferida]="horaPreferida()"
          [clientes]="clientes()"
          [ascensores]="ascensoresFiltrados()"
          [disabled]="state() === 'loading'"
          (fechaChange)="onFechaChange($event)"
          (clienteChange)="onClienteChange($event)"
          (ascensorChange)="onAscensorChange($event)"
          (tipoChange)="onTipoChange($event)"
          (horaChange)="horaPreferida.set($event)"
          (generar)="onGenerar()"
        />
      }

      <!-- Mantenimientos vencidos (contexto — siempre visible excepto cuando hay sugerencia) -->
      @if (state() !== 'sugerencia_lista' && state() !== 'confirming' && state() !== 'confirmado') {
        <app-ai-scheduler-demand-context
          [demanda]="demandaContexto()"
          (prellenar)="onPrellenar($event)"
        />
      }

      <!-- Error global -->
      @if (errorMessage()) {
        <div class="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700 font-medium">{{ errorMessage() }}</p>
          <button
            type="button"
            (click)="errorMessage.set(null)"
            class="mt-2 text-xs text-red-600 underline hover:text-red-800 focus:outline-none"
          >
            Cerrar
          </button>
        </div>
      }

      <!-- Spinner de carga -->
      @if (state() === 'loading') {
        <div class="flex flex-col items-center justify-center py-16 text-gray-500">
          <div class="animate-spin inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p class="text-base font-medium">Buscando técnico óptimo...</p>
          <p class="text-sm text-gray-400 mt-1">Evaluando disponibilidad con IA</p>
        </div>
      }

      <!-- Panel de sugerencia -->
      @if ((state() === 'sugerencia_lista' || state() === 'confirming') && sugerenciaActual()) {
        <!-- Contexto del trabajo en la parte superior -->
        <div class="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="font-medium text-gray-800">{{ sugerenciaActual()!.trabajo.nombre_cliente }}</span>
            <span class="text-gray-400">—</span>
            <span class="text-gray-600">{{ sugerenciaActual()!.trabajo.tipo_trabajo }}</span>
            <span class="text-gray-400">—</span>
            <span class="text-gray-500">{{ sugerenciaActual()!.fecha }}</span>
          </div>
          <button
            type="button"
            (click)="onDescartar()"
            [disabled]="state() === 'confirming'"
            class="text-xs text-gray-400 underline hover:text-gray-600 disabled:opacity-50 focus:outline-none flex-shrink-0"
          >
            ← Volver
          </button>
        </div>

        <app-ai-scheduler-suggestion
          [sugerencia]="sugerenciaActual()"
          [state]="state()"
          (confirmar)="onConfirmar($event)"
          (descartar)="onDescartar()"
        />
      }

      <!-- Estado confirmado -->
      @if (state() === 'confirmado') {
        <div class="flex flex-col items-center justify-center py-16 px-4">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span class="text-2xl">✅</span>
          </div>
          <p class="text-lg font-semibold text-green-700">¡Programación creada!</p>
          @if (ultimaConfirmacion()) {
            <p class="text-sm text-green-600 mt-1 text-center">
              {{ ultimaConfirmacion()!.nombre }} {{ ultimaConfirmacion()!.apellido }}
              — {{ ultimaConfirmacion()!.hora_inicio }}–{{ ultimaConfirmacion()!.hora_fin }}
            </p>
          }
          <button
            type="button"
            (click)="onNuevoTrabajo()"
            class="mt-6 px-5 py-2.5 rounded-lg text-sm font-semibold text-blue-600 border border-blue-300
                   hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Programar otro trabajo
          </button>
        </div>
      }

    </div>
  `,
})
export class AIAssistantComponent implements OnInit {
  private schedulerService = inject(IaSchedulerService);
  private clientService = inject(ClientService);
  private elevatorService = inject(ElevatorService);

  // ============= State signals =============
  state = signal<SchedulerState>('idle');
  errorMessage = signal<string | null>(null);

  // Formulario
  selectedDate = signal<string>(this.getTomorrow());
  selectedClienteId = signal<number | null>(null);
  selectedAscensorId = signal<number | null>(null);
  selectedTipo = signal<TipoTrabajo>('mantenimiento');
  horaPreferida = signal<string>('');
  mantenimientoFijoIdContexto = signal<number | null>(null);

  // Datos de selects
  clientes = signal<Client[]>([]);
  todosAscensores = signal<Elevator[]>([]);
  tecnicosInfo = signal<TecnicoConCarga[]>([]);

  // Contexto informativo
  demandaContexto = signal<DemandResponse | null>(null);

  // Resultado
  sugerenciaActual = signal<SugerenciaResponse | null>(null);
  ultimaConfirmacion = signal<SlotSugerido | null>(null);

  // Ascensores filtrados por cliente seleccionado
  ascensoresFiltrados = computed(() => {
    const clienteId = this.selectedClienteId();
    if (!clienteId) return [];
    return this.todosAscensores().filter(a => a.cliente_id === clienteId);
  });

  // ============= Lifecycle =============

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  // ============= Handlers de formulario =============

  onFechaChange(nuevaFecha: string): void {
    this.selectedDate.set(nuevaFecha);
    this.sugerenciaActual.set(null);
    this.state.set('idle');
    this.cargarContexto(nuevaFecha);
  }

  onClienteChange(clienteId: number): void {
    this.selectedClienteId.set(clienteId || null);
    this.selectedAscensorId.set(null);
    this.mantenimientoFijoIdContexto.set(null);
  }

  onAscensorChange(ascensorId: number): void {
    this.selectedAscensorId.set(ascensorId || null);
    this.mantenimientoFijoIdContexto.set(null);
  }

  onTipoChange(tipo: TipoTrabajo): void {
    this.selectedTipo.set(tipo);
  }

  // ============= Prellenado desde contexto de mantenimientos =============

  onPrellenar(item: MantenimientoVencido): void {
    this.selectedClienteId.set(item.cliente_id);
    this.selectedAscensorId.set(item.ascensor_id);
    this.selectedTipo.set('mantenimiento');
    this.horaPreferida.set(item.hora_preferida ?? '');
    this.mantenimientoFijoIdContexto.set(item.mantenimiento_fijo_id);
    this.errorMessage.set(null);
  }

  // ============= Generar sugerencia =============

  onGenerar(): void {
    const clienteId = this.selectedClienteId();
    const ascensorId = this.selectedAscensorId();
    if (!clienteId || !ascensorId) return;

    this.errorMessage.set(null);
    this.state.set('loading');

    const tecnicoIds = this.tecnicosInfo().map(t => t.trabajador_id);

    this.schedulerService.generar({
      fecha: this.selectedDate(),
      trabajo: {
        cliente_id: clienteId,
        ascensor_id: ascensorId,
        tipo_trabajo: this.selectedTipo(),
        hora_preferida: this.horaPreferida() || null,
      },
      tecnico_ids: tecnicoIds,
      instruccion_admin: null,
    }).subscribe({
      next: (sugerencia) => {
        this.sugerenciaActual.set(sugerencia);
        this.state.set('sugerencia_lista');
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Error al buscar técnico óptimo');
        this.state.set('idle');
      },
    });
  }

  // ============= Confirmar =============

  onConfirmar(slot: SlotSugerido): void {
    const sugerencia = this.sugerenciaActual();
    if (!sugerencia) return;

    this.state.set('confirming');
    this.errorMessage.set(null);

    this.schedulerService.confirmar({
      fecha: this.selectedDate(),
      trabajo: {
        cliente_id: sugerencia.trabajo.cliente_id,
        ascensor_id: sugerencia.trabajo.ascensor_id,
        tipo_trabajo: sugerencia.trabajo.tipo_trabajo,
        nombre_cliente: sugerencia.trabajo.nombre_cliente,
        hora_inicio: slot.hora_inicio,
        hora_fin: slot.hora_fin,
        justificacion: slot.justificacion,
      },
      tecnico_id: slot.trabajador_id,
      mantenimiento_fijo_id: this.mantenimientoFijoIdContexto(),
    }).subscribe({
      next: () => {
        this.ultimaConfirmacion.set(slot);
        this.state.set('confirmado');
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Error al confirmar la programación');
        this.state.set('sugerencia_lista');
      },
    });
  }

  // ============= Descartar / Nuevo =============

  onDescartar(): void {
    this.sugerenciaActual.set(null);
    this.state.set('idle');
    this.errorMessage.set(null);
  }

  onNuevoTrabajo(): void {
    this.sugerenciaActual.set(null);
    this.ultimaConfirmacion.set(null);
    this.selectedAscensorId.set(null);
    this.mantenimientoFijoIdContexto.set(null);
    this.state.set('idle');
    this.errorMessage.set(null);
    // Recargar contexto de mantenimientos por si cambió
    this.cargarContexto(this.selectedDate());
  }

  // ============= Carga de datos =============

  private cargarDatosIniciales(): void {
    forkJoin({
      clientes: this.clientService.getClients({ estado_activo: true }),
      ascensores: this.elevatorService.getElevators(),
      tecnicos: this.schedulerService.getTecnicos(this.selectedDate()),
      demanda: this.schedulerService.getDemand(this.selectedDate()),
    }).subscribe({
      next: ({ clientes, ascensores, tecnicos, demanda }) => {
        this.clientes.set(clientes);
        this.todosAscensores.set(ascensores);
        this.tecnicosInfo.set(tecnicos.tecnicos);
        this.demandaContexto.set(demanda);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Error al cargar los datos iniciales');
      },
    });
  }

  private cargarContexto(fecha: string): void {
    forkJoin({
      tecnicos: this.schedulerService.getTecnicos(fecha),
      demanda: this.schedulerService.getDemand(fecha),
    }).subscribe({
      next: ({ tecnicos, demanda }) => {
        this.tecnicosInfo.set(tecnicos.tecnicos);
        this.demandaContexto.set(demanda);
      },
      error: (err) => {
        console.error('Error al cargar contexto:', err);
      },
    });
  }

  private getTomorrow(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}
