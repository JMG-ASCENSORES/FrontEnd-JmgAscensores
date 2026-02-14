import { Component, Input, Output, EventEmitter, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full relative">
      <label *ngIf="label" class="block text-xs font-bold text-slate-600 uppercase mb-2 ml-1">{{ label }}</label>
      <div class="relative w-full">
         <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
             <i [class]="iconClass"></i>
         </div>
         <input 
            type="text" 
            [ngModel]="value()"
            (ngModelChange)="value.set($event)"
            [placeholder]="placeholder"
            class="block w-full p-3 pl-12 text-sm text-slate-900 border-2 border-gray-300 rounded-lg bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-shadow" 
         />
      </div>
    </div>
  `
})
export class FilterInputComponent {
  @Input() label: string = 'Búsqueda';
  @Input() placeholder: string = 'Buscar...';
  @Input() iconClass: string = 'bi bi-search text-gray-400 text-lg';
  
  // Two-way binding signal (Angular 17.2+)
  value = model<string>('');
}
