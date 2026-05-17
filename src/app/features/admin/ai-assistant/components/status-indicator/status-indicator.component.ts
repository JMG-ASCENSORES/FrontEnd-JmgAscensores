import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { StatusStep } from '../../../models/ia-scheduler.interface';

@Component({
  selector: 'app-status-indicator',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './status-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusIndicatorComponent {
  @Input() steps: StatusStep[] = [];

  /** True when any step is currently active — drives the shimmer bar. */
  hasActiveStep(): boolean {
    return this.steps.some((s) => s.status === 'active');
  }

  /** Returns colour + weight classes per step status. */
  stepStatusClass(status: StatusStep['status']): string {
    switch (status) {
      case 'done':    return 'text-emerald-700';
      case 'active':  return 'text-ai-dark font-semibold';
      case 'pending': return 'text-slate-400';
      case 'error':   return 'text-red-600';
      default:        return '';
    }
  }
}
