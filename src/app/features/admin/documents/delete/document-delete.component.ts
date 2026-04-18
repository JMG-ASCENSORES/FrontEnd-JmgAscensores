import { LucideAngularModule } from 'lucide-angular';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';

import { ReportService } from '../../services/report.service';
import { Report } from '../../../../core/models/report.model';

@Component({
  selector: 'app-document-delete',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './document-delete.component.html',
  styleUrl: './document-delete.component.scss'
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
        // Sometimes 404 just means it's already gone, so we could treat as success or show error.
        // Assuming error if failed.
        this.error.set('Error al eliminar el documento. Intente nuevamente.');
        this.isDeleting.set(false);
      }
    });
  }

  onCancel() {
    this.close.emit();
  }
}
