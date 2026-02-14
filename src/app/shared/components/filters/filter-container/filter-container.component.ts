import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col md:flex-row gap-6 items-end">
      <ng-content></ng-content>
    </div>
  `
})
export class FilterContainerComponent {}
