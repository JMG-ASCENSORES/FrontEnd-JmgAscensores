import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-entity-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl shadow-lg border border-gray-300 p-6 relative hover:shadow-2xl hover:border-blue-300 transition-all duration-300 group flex flex-col justify-between h-full">
      
      <!-- Top Actions (Edit, etc) -->
      <div class="absolute top-4 right-4 z-20 flex gap-2">
         <ng-content select="[action-top]"></ng-content>
      </div>

      <!-- Main Content -->
      <div class="flex-1">
        <ng-content></ng-content>
      </div>

      <!-- Footer -->
      <div class="mt-4 pt-4 border-t border-gray-200">
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
