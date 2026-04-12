import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [],
  template: `
    <div class="skeleton-container" [class]="containerClass">
      @for (item of countArray; track item) {
        <div [class]="itemClass">
          <div class="skeleton-shimmer"></div>
          <ng-content></ng-content>
        </div>
      }
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
