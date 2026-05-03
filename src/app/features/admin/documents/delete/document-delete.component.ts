import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { ReportService } from '../../services/report.service';
import { Report } from '../../../../core/models/report.model';

@Component({
  selector: 'app-document-delete',
  standalone: true,
  imports: [ConfirmModalComponent],
  template: `
    <app-confirm-modal
      title="¿Eliminar Documento?"
      [message]="'Estás a punto de eliminar el documento <strong>#' + report.informe_id + '</strong>. Esta acción no se puede deshacer.'"
      confirmText="Eliminar"
      cancelText="Cancelar"
      icon="trash-2"
      confirmVariant="danger"
      [isLoading]="isDeleting()"
      [errorMessage]="error() || ''"
      (close)="onCancel()"
      (confirm)="onDelete()"
    />
  `,
})
export class DocumentDeleteComponent {
  @Input({ required: true }) report!: Report;
  @Output() close = new EventEmitter<void>();
  @Output() reportDeleted = new EventEmitter<void>();

  private reportService = inject(ReportService);

  isDeleting = signal(false);
  error = signal<string | null>(null);

  onDelete() {
    this.isDeleting.set(true);
    this.error.set(null);

    this.reportService.deleteReport(this.report.informe_id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.reportDeleted.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error deleting report', err);
        this.error.set('Error al eliminar el documento. Intente nuevamente.');
        this.isDeleting.set(false);
      }
    });
  }

  onCancel() {
    this.close.emit();
  }
}