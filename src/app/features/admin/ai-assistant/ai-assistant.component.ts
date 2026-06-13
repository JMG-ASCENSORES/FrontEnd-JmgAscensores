import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { IaSchedulerService } from '../../../core/services/ia-scheduler.service';
import { ClientService } from '../services/client.service';
import { ElevatorService } from '../services/elevator.service';
import { SuggestionCardComponent } from './components/suggestion-card/suggestion-card.component';
import { DemandCardComponent } from './components/demand-card/demand-card.component';
import { ConfirmationCardComponent } from './components/confirmation-card/confirmation-card.component';
import { StatusIndicatorComponent } from './components/status-indicator/status-indicator.component';
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
  StatusStep,
} from '../models/ia-scheduler.interface';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    SuggestionCardComponent,
    DemandCardComponent,
    ConfirmationCardComponent,
    StatusIndicatorComponent,
  ],
  templateUrl: './ai-assistant.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AIAssistantComponent implements OnInit {
  private schedulerService = inject(IaSchedulerService);
  private clientService = inject(ClientService);
  private elevatorService = inject(ElevatorService);

  // ── Core state ──
  state = signal<SchedulerState>('idle');
  initializing = signal(true);
  errorMessage = signal<string | null>(null);

  // ── Form fields ──
  selectedDate = signal(this.getTomorrow());
  selectedClienteId = signal<number | null>(null);
  selectedAscensorId = signal<number | null>(null);
  selectedTipo = signal<TipoTrabajo>('mantenimiento');
  horaPreferida = signal('');
  mantenimientoFijoIdContexto = signal<number | null>(null);

  // ── Data ──
  clientes = signal<Client[]>([]);
  todosAscensores = signal<Elevator[]>([]);
  tecnicosInfo = signal<TecnicoConCarga[]>([]);
  demandaContexto = signal<DemandResponse | null>(null);

  // ── Result ──
  sugerenciaActual = signal<SugerenciaResponse | null>(null);
  ultimaConfirmacion = signal<SlotSugerido | null>(null);

  // ── Chat de ajuste (inline input) ──
  chatAjusteInput = '';

  // ── Combobox de cliente ──
  clienteDropdownOpen = signal(false);
  clienteSearchQuery = signal('');

  // ── Loading progression (simulated — backend is single HTTP call) ──
  currentStep = signal(0);
  private stepTimers: ReturnType<typeof setTimeout>[] = [];

  // ── Computed ──
  ascensoresFiltrados = computed(() => {
    const clienteId = this.selectedClienteId();
    if (!clienteId) return [];
    return this.todosAscensores().filter((a) => a.cliente_id === clienteId);
  });

  isProcessing = computed(() =>
    this.state() === 'loading' || this.state() === 'adjusting' || this.state() === 'confirming'
  );

  loadingSteps = computed<StatusStep[]>(() => {
    const current = this.currentStep();
    const labels = [
      'Evaluando disponibilidad de técnicos',
      'Validando con IA',
      'Generando sugerencia óptima',
    ];
    return labels.map((label, i) => ({
      label,
      status: i < current ? 'done' : i === current ? 'active' : 'pending',
    }));
  });

  clientesFiltrados = computed(() => {
    const query = this.clienteSearchQuery().toLowerCase().trim();
    if (!query) return this.clientes();
    return this.clientes().filter((c) =>
      (c.nombre_comercial?.toLowerCase().includes(query)) ||
      (c.contacto_nombre?.toLowerCase().includes(query)) ||
      (c.contacto_apellido?.toLowerCase().includes(query))
    );
  });

  clienteSeleccionado = computed(() => {
    const id = this.selectedClienteId();
    if (!id) return null;
    return this.clientes().find((c) => c.cliente_id === id) ?? null;
  });

  // Context strip metrics (OpenCode/Cursor-style)
  tecnicosCount = computed(() => this.tecnicosInfo().length);
  vencidosCount = computed(() => this.demandaContexto()?.trabajos?.length ?? 0);
  fechaFormateada = computed(() => {
    const fecha = this.selectedDate();
    if (!fecha) return '';
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const d = new Date(fecha + 'T00:00:00');
    return `${d.getDate()} ${months[d.getMonth()]}`;
  });

  // ── Static config ──
  readonly tipos: { value: TipoTrabajo; label: string; activeClass: string }[] = [
    { value: 'mantenimiento', label: 'Mantenimiento', activeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'reparacion', label: 'Reparación', activeClass: 'bg-orange-50 text-orange-700 border-orange-200' },
    { value: 'inspeccion', label: 'Inspección', activeClass: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { value: 'emergencia', label: 'Emergencia', activeClass: 'bg-red-50 text-red-700 border-red-200' },
  ];

  readonly quickChips = [
    'Excluir a este técnico',
    'Prefiero alguien de la zona',
    'Menor carga horaria',
    'El más cercano',
  ];

  get tomorrowStr(): string {
    return this.getTomorrow();
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  // ══════════════════════════════════════════
  //  DATA LOADING
  // ══════════════════════════════════════════

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
        this.initializing.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Error al cargar los datos iniciales');
        this.initializing.set(false);
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

  // ══════════════════════════════════════════
  //  HANDLERS — FORM SUBMIT
  // ══════════════════════════════════════════

  onGenerar(): void {
    const clienteId = this.selectedClienteId();
    const ascensorId = this.selectedAscensorId();
    if (!clienteId || !ascensorId) return;

    const tecnicoIds = this.tecnicosInfo().map((t) => t.trabajador_id);
    if (tecnicoIds.length === 0) {
      this.errorMessage.set('No hay técnicos activos disponibles para esta fecha.');
      return;
    }

    this.errorMessage.set(null);
    this.state.set('loading');
    this.startLoadingProgression();

    this.schedulerService
      .generar({
        fecha: this.selectedDate(),
        trabajo: {
          cliente_id: clienteId,
          ascensor_id: ascensorId,
          tipo_trabajo: this.selectedTipo(),
          hora_preferida: this.horaPreferida() || null,
        },
        tecnico_ids: tecnicoIds,
        instruccion_admin: null,
      })
      .subscribe({
        next: (sugerencia) => {
          this.clearLoadingProgression();
          this.sugerenciaActual.set(sugerencia);
          this.state.set('sugerencia_lista');
        },
        error: (err) => {
          this.clearLoadingProgression();
          this.state.set('idle');
          this.errorMessage.set(err.message || 'Error al buscar técnico óptimo');
        },
      });
  }

  private startLoadingProgression(): void {
    this.clearLoadingProgression();
    this.currentStep.set(0);
    this.stepTimers.push(setTimeout(() => this.currentStep.set(1), 1500));
    this.stepTimers.push(setTimeout(() => this.currentStep.set(2), 3500));
  }

  private clearLoadingProgression(): void {
    this.stepTimers.forEach(clearTimeout);
    this.stepTimers = [];
  }

  // ══════════════════════════════════════════
  //  HANDLERS — DEMAND CARD PRE-FILL
  // ══════════════════════════════════════════

  onPrellenar(item: MantenimientoVencido): void {
    this.selectedClienteId.set(item.cliente_id);
    this.selectedAscensorId.set(item.ascensor_id);
    this.selectedTipo.set('mantenimiento');
    this.horaPreferida.set(item.hora_preferida ?? '');
    this.mantenimientoFijoIdContexto.set(item.mantenimiento_fijo_id);
    this.errorMessage.set(null);

    if (item.cliente_id && item.ascensor_id) {
      setTimeout(() => this.onGenerar(), 100);
    }
  }

  // ══════════════════════════════════════════
  //  HANDLERS — CONFIRM
  // ══════════════════════════════════════════

  onConfirmar(slot: SlotSugerido): void {
    const sugerencia = this.sugerenciaActual();
    if (!sugerencia) return;

    this.state.set('confirming');

    this.schedulerService
      .confirmar({
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
      })
      .subscribe({
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

  // ══════════════════════════════════════════
  //  HANDLERS — CHAT ADJUST
  // ══════════════════════════════════════════

  onAjustar(): void {
    const instruccion = this.chatAjusteInput.trim();
    const actual = this.sugerenciaActual();
    if (!instruccion || !actual) return;

    this.state.set('adjusting');

    this.schedulerService
      .ajustar({
        evaluacion_actual: actual,
        instruccion_admin: instruccion,
      })
      .subscribe({
        next: (nueva) => {
          this.sugerenciaActual.set(nueva);
          this.chatAjusteInput = '';
          this.state.set('sugerencia_lista');
        },
        error: (err) => {
          this.state.set('sugerencia_lista');
          this.errorMessage.set(err.message || 'Error al ajustar la sugerencia');
        },
      });
  }

  // ══════════════════════════════════════════
  //  HANDLERS — FORM FIELD CHANGES
  // ══════════════════════════════════════════

  onFechaChange(nuevaFecha: string): void {
    this.selectedDate.set(nuevaFecha);
    this.sugerenciaActual.set(null);
    this.state.set('idle');
    this.cargarContexto(nuevaFecha);
  }

  onClienteChange(clienteId: number | null): void {
    this.selectedClienteId.set(clienteId || null);
    this.selectedAscensorId.set(null);
    this.mantenimientoFijoIdContexto.set(null);
  }

  onAscensorChange(ascensorId: number | null): void {
    this.selectedAscensorId.set(ascensorId || null);
    this.mantenimientoFijoIdContexto.set(null);
  }

  onTipoChange(tipo: TipoTrabajo): void {
    this.selectedTipo.set(tipo);
  }

  onHoraChange(hora: string): void {
    this.horaPreferida.set(hora);
  }

  // ══════════════════════════════════════════
  //  HANDLERS — RESET
  // ══════════════════════════════════════════

  onNuevoTrabajo(): void {
    this.sugerenciaActual.set(null);
    this.ultimaConfirmacion.set(null);
    this.selectedClienteId.set(null);
    this.selectedAscensorId.set(null);
    this.selectedTipo.set('mantenimiento');
    this.horaPreferida.set('');
    this.mantenimientoFijoIdContexto.set(null);
    this.chatAjusteInput = '';
    this.state.set('idle');
    this.errorMessage.set(null);
    this.cargarContexto(this.selectedDate());
  }

  onDescartar(): void {
    this.sugerenciaActual.set(null);
    this.chatAjusteInput = '';
    this.state.set('idle');
    this.errorMessage.set(null);
  }

  puedeGenerar(): boolean {
    return !!this.selectedClienteId() && !!this.selectedAscensorId();
  }

  clienteDisplayName(c: Client): string {
    return (
      c.nombre_comercial ||
      `${c.contacto_nombre || ''} ${c.contacto_apellido || ''}`.trim() ||
      'Cliente sin nombre'
    );
  }

  // ══════════════════════════════════════════
  //  HANDLERS — CLIENTE COMBOBOX
  // ══════════════════════════════════════════

  toggleClienteDropdown(): void {
    if (this.isProcessing() || this.clientes().length === 0) return;
    const opening = !this.clienteDropdownOpen();
    this.clienteDropdownOpen.set(opening);
    if (opening) {
      this.clienteSearchQuery.set('');
      setTimeout(() => document.getElementById('cliente-search-input')?.focus(), 0);
    }
  }

  closeClienteDropdown(): void {
    this.clienteDropdownOpen.set(false);
    this.clienteSearchQuery.set('');
  }

  selectCliente(id: number): void {
    this.onClienteChange(id);
    this.closeClienteDropdown();
  }

  clienteOptionClass(c: Client): string {
    return this.selectedClienteId() === c.cliente_id
      ? 'bg-[#003B73]/5 text-[#003B73] font-semibold'
      : 'text-slate-700 hover:bg-slate-50';
  }

  clienteTriggerClass(): string {
    const base =
      'w-full px-3 py-2.5 rounded-xl border text-sm text-left flex items-center justify-between gap-2 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed transition-all outline-none ' +
      'enabled:hover:bg-white enabled:hover:border-slate-300';
    return this.clienteDropdownOpen()
      ? `${base} bg-white border-[#003B73] ring-2 ring-[#003B73]/10`
      : `${base} bg-slate-50 border-slate-200 focus:bg-white focus:border-[#003B73] focus:ring-2 focus:ring-[#003B73]/10`;
  }

  // ══════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════

  private getTomorrow(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}
