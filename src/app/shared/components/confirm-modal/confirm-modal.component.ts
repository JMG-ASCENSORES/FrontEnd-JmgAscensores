import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent {
  @Input() title: string = '¿Estás seguro?';
  @Input() message: string = '';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() icon: string = 'trash-2';
  @Input() confirmVariant: 'danger' | 'warning' | 'primary' = 'danger';
  @Input() isLoading: boolean = false;
  @Input() errorMessage: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}