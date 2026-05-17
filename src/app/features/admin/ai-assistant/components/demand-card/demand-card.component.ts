import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { MantenimientoVencido } from '../../../models/ia-scheduler.interface';

@Component({
  selector: 'app-demand-card',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './demand-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemandCardComponent {
  @Input() items: MantenimientoVencido[] = [];
  @Input() fecha = '';

  @Output() prellenar = new EventEmitter<MantenimientoVencido>();
}
