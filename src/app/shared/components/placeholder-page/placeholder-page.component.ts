import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
      <div class="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-green-600 shadow-inner">
        <i [class]="icon + ' text-4xl'"></i>
      </div>
      <h2 class="text-3xl font-bold text-gray-900 mb-2">{{ title }}</h2>
      <p class="text-gray-500 max-w-md mx-auto leading-relaxed">
        Estamos trabajando para traerte lo mejor en la sección de {{ title.toLowerCase() }}. 
        Muy pronto podrás gestionar todo desde aquí.
      </p>
      <div class="mt-8 flex gap-3">
        <div class="w-2 h-2 rounded-full bg-green-200 animate-bounce" style="animation-delay: 0s"></div>
        <div class="w-2 h-2 rounded-full bg-green-400 animate-bounce" style="animation-delay: 0.2s"></div>
        <div class="w-2 h-2 rounded-full bg-green-600 animate-bounce" style="animation-delay: 0.4s"></div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PlaceholderPageComponent {
  @Input() title: string = 'Próximamente';
  @Input() icon: string = 'bi bi-tools';
}
