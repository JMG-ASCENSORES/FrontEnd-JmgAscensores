import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { SlotSugerido, WorkItemEnriquecido, TipoTrabajo } from '../../../models/ia-scheduler.interface';

@Component({
  selector: 'app-confirmation-card',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './confirmation-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationCardComponent {
  @Input() slot!: SlotSugerido;
  @Input() fecha = '';
  @Input() trabajo!: WorkItemEnriquecido;

  /** Spanish date formatting: "17 Mayo 2026" */
  formatDate(dateStr: string): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  /** Tipo badge color classes — matches project-wide convention */
  tipoBadgeClass(tipo: TipoTrabajo): string {
    const map: Record<TipoTrabajo, string> = {
      emergencia: 'bg-red-100 text-red-700',
      reparacion: 'bg-orange-100 text-orange-700',
      inspeccion: 'bg-yellow-100 text-yellow-700',
      mantenimiento: 'bg-blue-100 text-blue-700',
    };
    return map[tipo] ?? 'bg-slate-100 text-slate-600';
  }
}
