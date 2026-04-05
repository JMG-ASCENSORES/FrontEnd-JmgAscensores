import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container" [class]="containerClass">
      <div *ngFor="let item of countArray" [class]="itemClass">
        <div class="skeleton-shimmer"></div>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrl: './skeleton-loader.component.scss'
})
export class SkeletonLoaderComponent {
  @Input() count: number = 3;
  @Input() itemClass: string = 'skeleton-card';
  @Input() containerClass: string = 'skeleton-grid';

  get countArray() {
    return Array(this.count).fill(0);
  }
}
