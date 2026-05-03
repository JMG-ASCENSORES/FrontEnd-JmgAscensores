import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../../shared/components/placeholder-page/placeholder-page.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [PlaceholderPageComponent, LucideAngularModule],
  template: `<app-placeholder-page title="Reportes" icon="bar-chart-2"></app-placeholder-page>`,
})
export class ReportsComponent {}