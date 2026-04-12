import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClass" [class.overlay]="overlay">
      <div class="spinner-wrapper">
        <div class="spinner" [ngClass]="size"></div>
        @if (message) {
          <span class="loading-text">{{ message }}</span>
        }
      </div>
    </div>
    `,
  styleUrl: './loading-spinner.component.scss'
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() message: string | null = null;
  @Input() overlay: boolean = false;
  @Input() containerClass: string = 'loading-container';
}
