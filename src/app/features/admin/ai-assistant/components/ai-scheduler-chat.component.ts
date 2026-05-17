import { Component, Input, output, signal } from '@angular/core';
import type { SugerenciaResponse } from '../../models/ia-scheduler.interface';

export interface ChatMessage {
  role: 'user' | 'system';
  content: string;
}

@Component({
  selector: 'app-ai-scheduler-chat',
  standalone: true,
  template: `
    <div class="border-t border-gray-200 p-4">
      <p class="text-xs text-gray-400 mb-2">Pedile ajustes a la IA en lenguaje natural:</p>
      <div class="max-h-40 overflow-y-auto space-y-2 mb-3">
        @for (msg of messages(); track $index) {
          <div [class]="msg.role === 'user' ? 'text-right' : 'text-left'">
            <span [class]="msg.role === 'user'
              ? 'inline-block bg-blue-500 text-white px-3 py-1 rounded-lg text-sm max-w-xs'
              : 'inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm max-w-xs'">
              {{ msg.content }}
            </span>
          </div>
        }
        @if (adjusting) {
          <div class="text-left">
            <span class="inline-block bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-sm animate-pulse">
              Ajustando sugerencia...
            </span>
          </div>
        }
      </div>
      <div class="flex gap-2">
        <input #chatInput
               (keydown.enter)="onEnviar(chatInput); chatInput.value = ''"
               placeholder="Ej: no me des a Carlos, está saturado hoy..."
               class="flex-1 border rounded px-3 py-2 text-sm"
               [disabled]="adjusting"/>
        <button (click)="onEnviar(chatInput); chatInput.value = ''"
                [disabled]="adjusting() || !chatInput.value.trim()"
                class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 transition-colors">
          &rarr;
        </button>
      </div>
    </div>
  `,
})
export class AiSchedulerChatComponent {
  @Input() sugerencia: SugerenciaResponse | null = null;
  @Input() adjusting = false;
  ajustar = output<string>();

  messages = signal<ChatMessage[]>([]);

  onEnviar(input: HTMLInputElement): void {
    const text = input.value.trim();
    if (!text || this.adjusting) return;

    this.messages.update(msgs => [...msgs, { role: 'user', content: text }]);
    this.ajustar.emit(text);
  }
}
