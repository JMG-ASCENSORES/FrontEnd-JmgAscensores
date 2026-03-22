import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalVariant = 'primary' | 'neutral' | 'danger';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-modal-wrapper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-wrapper.component.html',
})
export class ModalWrapperComponent {
  /** Texto del título en el header */
  @Input({ required: true }) title: string = '';

  /** Subtítulo opcional debajo del título */
  @Input() subtitle?: string;

  /** Variante de color del header:
   * - 'primary': azul oscuro JMG (#003B73) — para modales de creación/edición de documentos
   * - 'neutral': fondo gris claro — para modales de clientes/técnicos
   * - 'danger': no tiene header propio, el body tiene el ícono de alerta
   */
  @Input() variant: ModalVariant = 'neutral';

  /** Tamaño máximo del panel */
  @Input() size: ModalSize = 'md';

  /** Emitido cuando el usuario hace clic en el backdrop o en el botón X */
  @Output() close = new EventEmitter<void>();

  get maxWidthClass(): string {
    const map: Record<ModalSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
    };
    return map[this.size];
  }
}
