import { Component, input } from '@angular/core';
import { AuditActor } from '../../../core/models/audit.model';
import { formatDateShort } from '../../utils/date-lima.util';

@Component({
  selector: 'app-audit-info',
  standalone: true,
  imports: [],
  template: `
    @if (usuarioCreacion() || usuarioModificacion() || fechaCreacion() || fechaActualizacion()) {
      <div class="text-xs bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 mt-4 space-y-1">
        @if (usuarioCreacion() || fechaCreacion()) {
          <p class="text-slate-700">
            <span class="font-semibold text-jmg">Creado por</span>
            {{ usuarioCreacion()?.nombre_completo ?? '—' }}
            @if (fechaCreacion()) {
              · <span class="text-slate-500">{{ formatDate(fechaCreacion()) }}</span>
            }
          </p>
        }
        @if (usuarioModificacion() || fechaActualizacion()) {
          <p class="text-slate-700">
            <span class="font-semibold text-jmg">Última modificación por</span>
            {{ usuarioModificacion()?.nombre_completo ?? '—' }}
            @if (fechaActualizacion()) {
              · <span class="text-slate-500">{{ formatDate(fechaActualizacion()) }}</span>
            }
          </p>
        }
      </div>
    }
  `,
})
export class AuditInfoComponent {
  fechaCreacion = input<string | null | undefined>();
  fechaActualizacion = input<string | null | undefined>();
  usuarioCreacion = input<AuditActor | null | undefined>();
  usuarioModificacion = input<AuditActor | null | undefined>();

  protected formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    return formatDateShort(value);
  }
}
