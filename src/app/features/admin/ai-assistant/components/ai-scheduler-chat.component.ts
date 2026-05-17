import { Component, Input, output, signal } from '@angular/core';

export interface ChatMessage {
  role: 'user' | 'system';
  content: string;
}

@Component({
  selector: 'app-ai-scheduler-chat',
  standalone: true,
  template: `
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center gap-3 px-1">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-[#003B73] to-[#001f3f] flex items-center justify-center shadow-md shadow-[#003B73]/20">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4v1h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/>
            <path d="M9 18v-4"/>
            <path d="M15 18v-4"/>
            <path d="M9 10h.01"/>
            <path d="M15 10h.01"/>
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-700 font-display">Asistente IA</p>
          <p class="text-[11px] text-slate-400">Claude Haiku &mdash; Ajust&aacute; la sugerencia en lenguaje natural</p>
        </div>
      </div>

      <!-- Message list -->
      <div class="max-h-52 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        @if (messages().length === 0) {
          <div class="text-center py-6">
            <p class="text-xs text-slate-400 leading-relaxed">
              Prob&aacute; escribir algo como:<br/>
              <span class="text-slate-500 font-medium">"no me des a Carlos, est&aacute; saturado hoy"</span><br/>
              <span class="text-slate-500 font-medium">"prefiero a alguien de la zona sur"</span><br/>
              <span class="text-slate-500 font-medium">"mostrame solo t&eacute;cnicos de mantenimiento"</span>
            </p>
          </div>
        }

        @for (msg of messages(); track $index) {
          <div [class]="msg.role === 'user' ? 'flex justify-end' : 'flex items-start gap-2'">
            <!-- AI avatar (only for system messages) -->
            @if (msg.role === 'system') {
              <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-jmg to-jmg-light flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="5 12 10 17 19 8"/>
                </svg>
              </div>
            }

            <div [class]="msg.role === 'user'
              ? 'max-w-[75%] bg-[#003B73] text-white px-4 py-2.5 rounded-xl rounded-br-md shadow-sm shadow-[#003B73]/15'
              : 'max-w-[80%] bg-white border border-slate-200 px-4 py-2.5 rounded-xl rounded-bl-md shadow-sm'">
              <p class="text-sm leading-relaxed"
                 [class]="msg.role === 'user' ? 'text-white' : 'text-slate-600'">
                {{ msg.content }}
              </p>
            </div>

            <!-- User avatar (only for user messages) -->
            @if (msg.role === 'user') {
              <div class="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            }
          </div>
        }

        @if (adjusting) {
          <div class="flex items-start gap-2">
            <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-jmg to-jmg-light flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="5 12 10 17 19 8"/>
              </svg>
            </div>
            <div class="bg-white border border-slate-200 px-4 py-2.5 rounded-xl rounded-bl-md shadow-sm">
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-jmg animate-bounce [animation-delay:0ms]"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-jmg animate-bounce [animation-delay:150ms]"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-jmg animate-bounce [animation-delay:300ms]"></span>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Input area -->
      <div class="flex gap-2.5 items-end">
        <input
          #chatInput
          (keydown.enter)="onEnviar(chatInput); chatInput.value = ''"
          placeholder="Escrib&iacute; tu ajuste..."
          class="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700
                 placeholder:text-slate-400
                 focus:bg-white focus:border-jmg focus:ring-2 focus:ring-jmg/10
                 transition-all outline-none
                 disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="adjusting"
        />
        <button
          (click)="onEnviar(chatInput); chatInput.value = ''"
          [disabled]="adjusting() || !chatInput.value.trim()"
          class="px-4 py-2.5 bg-[#003B73] hover:bg-[#001f3f] text-white text-sm font-semibold
                 rounded-xl shadow-md shadow-[#003B73]/20
                 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none
                 transition-all active:scale-[0.97] flex-shrink-0">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `,
})
export class AiSchedulerChatComponent {
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
