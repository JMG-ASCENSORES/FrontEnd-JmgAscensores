import { Component } from '@angular/core';


@Component({
  selector: 'app-filter-container',
  standalone: true,
  imports: [],
  template: `
    <div class="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col md:flex-row gap-6 items-end">
      <ng-content></ng-content>
    </div>
  `
})
export class FilterContainerComponent {}
