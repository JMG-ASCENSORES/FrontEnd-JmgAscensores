import { Component, Input, Output, EventEmitter, model } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-input',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="w-full relative">
      @if (label) {
        <label class="block text-xs font-bold text-slate-600 uppercase mb-2 ml-1">{{ label }}</label>
      }
      <div class="relative w-full">
        <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <lucide-icon [name]="icon" [size]="16" strokeWidth="1.5" class="text-slate-400"></lucide-icon>
        </div>
        <input
          type="text"
          [ngModel]="value()"
          (ngModelChange)="value.set($event)"
          [placeholder]="placeholder"
          class="block w-full p-3 pl-12 text-sm text-slate-900 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-jmg/20 focus:border-jmg outline-none transition-shadow"
          />
        </div>
      </div>
    `
})
export class FilterInputComponent {
  @Input() label: string = 'Búsqueda';
  @Input() placeholder: string = 'Buscar...';
  @Input() icon: string = 'search';
  
  // Two-way binding signal (Angular 17.2+)
  value = model<string>('');
}
