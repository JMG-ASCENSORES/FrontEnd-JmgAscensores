import { Component, Input, model } from '@angular/core';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-select',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="w-full">
      @if (label) {
        <label class="block text-xs font-bold text-slate-600 uppercase mb-2 ml-1">{{ label }}</label>
      }
      <div class="relative">
        <select
          [ngModel]="value()"
          (ngModelChange)="value.set($event)"
          class="w-full bg-white text-slate-700 text-sm font-medium rounded-lg border-2 border-gray-300 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 p-3 outline-none cursor-pointer appearance-none"
          >
          <option value="">{{ placeholder }}</option>
          @for (option of options; track option) {
            <option [value]="option">{{ option }}</option>
          }
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
          <i class="bi bi-chevron-down"></i>
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
