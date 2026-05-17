import { Component, Input, OnChanges, SimpleChanges, output, signal, viewChild, ElementRef } from '@angular/core';

export interface ChatMessage {
  role: 'user' | 'system';
  content: string;
}

const INTRO: ChatMessage = {
  role: 'system',
  content: 'Hola. Describí qué cambiar y actualizo la sugerencia al instante.',
};

const CHIPS = [
  'Excluí a este técnico',
  'Prefiero alguien de la zona',
  'Menor carga horaria',
  'El técnico más cercano',
];

@Component({
  selector: 'app-ai-scheduler-chat',
  standalone: true,
  template: `
    <div class="mx-4 mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      <!-- ─── Header ─────────────────────────────────────────── -->
      <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <!-- IA badge -->
          <div class="relative flex-shrink-0">
            <div class="w-7 h-7 rounded-lg bg-[#003B73] flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <!-- online dot -->
            <span class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-[1.5px] border-white"></span>
          </div>
          <div>
            <p class="text-[13px] font-semibold text-slate-800 font-display leading-none">Ajustá la sugerencia</p>
            <p class="text-[11px] text-slate-400 mt-0.5 leading-none">Claude Haiku · lenguaje natural</p>
          </div>
        </div>
        @if (messages().length > 1) {
          <button
            type="button"
            (click)="limpiar()"
            class="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
            Limpiar
          </button>
        }
      </div>

      <!-- ─── Messages ───────────────────────────────────────── -->
      <div #scrollEl class="px-4 py-4 max-h-64 overflow-y-auto space-y-3">

        @for (msg of messages(); track $index) {

          <!-- AI message -->
          @if (msg.role === 'system') {
            <div class="flex items-start gap-2.5">
              <div class="w-5 h-5 rounded-md bg-[#003B73] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="border-l-[2px] border-[#003B73]/30 pl-3 bg-slate-50 rounded-r-xl py-2.5 pr-3">
                  <p class="text-sm text-slate-600 leading-relaxed">{{ msg.content }}</p>
                </div>
                <!-- Chips solo después del mensaje intro (índice 0) -->
                @if ($index === 0) {
                  <div class="flex flex-wrap gap-1.5 mt-2.5">
                    @for (chip of chips; track chip) {
                      <button
                        type="button"
                        (click)="onChip(chip)"
                        [disabled]="adjusting"
                        class="text-[11px] px-2.5 py-1 rounded-full border border-[#003B73]/25
                               text-[#003B73] font-medium
                               hover:bg-[#003B73] hover:text-white hover:border-transparent
                               disabled:opacity-40 disabled:cursor-not-allowed
                               transition-all duration-150">
                        {{ chip }}
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- User message -->
          @if (msg.role === 'user') {
            <div class="flex justify-end gap-2 items-end">
              <div class="max-w-[75%] bg-[#003B73] text-white px-4 py-2.5 rounded-2xl rounded-br-md shadow-sm">
                <p class="text-sm leading-relaxed">{{ msg.content }}</p>
              </div>
              <div class="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center flex-shrink-0">
                <svg class="w-2.5 h-2.5 text-slate-500" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>
          }

        }

        <!-- Typing indicator -->
        @if (adjusting) {
          <div class="flex items-start gap-2.5">
            <div class="w-5 h-5 rounded-md bg-[#003B73] flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <div class="border-l-[2px] border-[#003B73]/30 pl-3 bg-slate-50 rounded-r-xl py-3 pr-4">
              <div class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style="animation-delay:0ms"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style="animation-delay:120ms"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style="animation-delay:240ms"></span>
              </div>
            </div>
          </div>
        }

      </div>

      <!-- ─── Input ───────────────────────────────────────────── -->
      <div class="px-4 pb-4 pt-1 border-t border-slate-100">
        <div class="relative flex items-center">
          <input
            #chatInput
            type="text"
            placeholder="Escribí tu ajuste..."
            (keydown.enter)="onEnviar(chatInput); chatInput.value = ''"
            [disabled]="adjusting"
            class="w-full pl-4 pr-11 py-2.5 rounded-xl bg-slate-50 border border-slate-200
                   text-sm text-slate-800 placeholder:text-slate-400
                   focus:bg-white focus:border-[#003B73] focus:ring-2 focus:ring-[#003B73]/10
                   disabled:opacity-50 disabled:cursor-not-allowed
                   outline-none transition-all"
          />
          <button
            type="button"
            (click)="onEnviar(chatInput); chatInput.value = ''"
            [disabled]="adjusting || !chatInput.value.trim()"
            class="absolute right-2 w-7 h-7 rounded-lg bg-[#003B73] flex items-center justify-center
                   hover:bg-[#002a52] active:scale-95
                   disabled:bg-slate-200
                   transition-all">
            <svg class="w-3 h-3 text-white disabled:text-slate-400" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

    </div>
  `,
})
export class AiSchedulerChatComponent implements OnChanges {
  @Input() adjusting = false;
  ajustar = output<string>();

  messages = signal<ChatMessage[]>([INTRO]);
  chips = CHIPS;

  private scrollEl = viewChild<ElementRef>('scrollEl');

  ngOnChanges(changes: SimpleChanges): void {
    const adj = changes['adjusting'];
    if (adj && !adj.firstChange && adj.previousValue === true && adj.currentValue === false) {
      this.messages.update(msgs => [
        ...msgs,
        { role: 'system', content: 'Listo. Revisé los candidatos con tu indicación. ¿Algo más?' },
      ]);
      setTimeout(() => this.scrollToBottom(), 30);
    }
  }

  onEnviar(input: HTMLInputElement): void {
    const text = input.value.trim();
    if (!text || this.adjusting) return;
    this.send(text);
    input.value = '';
  }

  onChip(text: string): void {
    if (this.adjusting) return;
    this.send(text);
  }

  limpiar(): void {
    this.messages.set([INTRO]);
  }

  private send(text: string): void {
    this.messages.update(msgs => [...msgs, { role: 'user', content: text }]);
    this.ajustar.emit(text);
    setTimeout(() => this.scrollToBottom(), 30);
  }

  private scrollToBottom(): void {
    const el = this.scrollEl();
    if (el) el.nativeElement.scrollTop = el.nativeElement.scrollHeight;
  }
}
