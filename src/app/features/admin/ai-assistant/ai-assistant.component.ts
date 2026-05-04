import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [PlaceholderPageComponent, LucideAngularModule],
  template: `<app-placeholder-page title="Asistente IA" icon="bot"></app-placeholder-page>`,
})
export class AIAssistantComponent {}