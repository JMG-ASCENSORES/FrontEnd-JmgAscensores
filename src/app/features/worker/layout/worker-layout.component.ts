import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-worker-layout',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  templateUrl: './worker-layout.component.html',
  styleUrl: './worker-layout.component.scss'
})
export class WorkerLayoutComponent {}
