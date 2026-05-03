import { Component, Input, model } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-select',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="w-full">
      @if (label) {
        <label class="block text-xs font-bold text-slate-600 uppercase mb-2 ml-1">{{ label }}</label>
      }
      <div class="relative">
        <select
          [ngModel]="value()"
          (ngModelChange)="value.set($event)"
          class="w-full bg-white text-slate-700 text-sm font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-jmg/20 focus:border-jmg p-3 outline-none cursor-pointer appearance-none"
          >
          <option value="">{{ placeholder }}</option>
          @for (option of options; track option) {
            <option [value]="option">{{ option }}</option>
          }
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
          <lucide-icon name="chevron-down" [size]="14" strokeWidth="1.5" class="text-slate-400"></lucide-icon>
        </div>
      </div>
    </div>
    `
})
export class FilterSelectComponent {
  @Input() label: string = '';
  @Input() placeholder: string = 'Seleccionar...';
  @Input() options: string[] = [];
  
  value = model<string>('');
}
