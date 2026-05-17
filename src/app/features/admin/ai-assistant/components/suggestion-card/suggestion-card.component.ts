import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type {
  SugerenciaResponse,
  SlotSugerido,
  SchedulerState,
} from '../../../models/ia-scheduler.interface';

@Component({
  selector: 'app-suggestion-card',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './suggestion-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestionCardComponent {
  @Input({ required: true }) sugerencia!: SugerenciaResponse;
  @Input() state: SchedulerState = 'sugerencia_lista';

  @Output() confirmar = new EventEmitter<SlotSugerido>();
  @Output() descartar = new EventEmitter<void>();

  showAlternatives = signal(false);

  toggleAlternatives(): void {
    this.showAlternatives.update((v) => !v);
  }

  tipoBadgeClass(tipo: string): string {
    const map: Record<string, string> = {
      emergencia: 'bg-red-100 text-red-700',
      reparacion: 'bg-orange-100 text-orange-700',
      inspeccion: 'bg-yellow-100 text-yellow-700',
      mantenimiento: 'bg-blue-100 text-blue-700',
    };
    return map[tipo] ?? 'bg-slate-100 text-slate-600';
  }

  isActionDisabled(): boolean {
    return this.state === 'confirming' || this.state === 'adjusting';
  }
}
