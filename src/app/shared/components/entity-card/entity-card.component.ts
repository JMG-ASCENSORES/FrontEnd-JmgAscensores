import { Component } from '@angular/core';


@Component({
  selector: 'app-entity-card',
  standalone: true,
  imports: [],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative hover:shadow-md hover:border-slate-200 transition-all duration-300 group flex flex-col justify-between h-full">
      
      <!-- Top Actions (Edit, etc) -->
      <div class="absolute top-4 right-4 z-20 flex gap-2">
         <ng-content select="[action-top]"></ng-content>
      </div>

      <!-- Main Content -->
      <div class="flex-1">
        <ng-content></ng-content>
      </div>

      <!-- Footer -->
      <div class="mt-4 pt-4 border-t border-slate-100">
         <ng-content select="[footer]"></ng-content>
      </div>
      
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class EntityCardComponent {}
