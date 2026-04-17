import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { DocumentDeleteComponent } from './document-delete.component';
import { ReportService } from '../../services/report.service';

describe('DocumentDeleteComponent', () => {
  let component: DocumentDeleteComponent;
  let fixture: ComponentFixture<DocumentDeleteComponent>;
  let reportServiceMock: any;

  beforeEach(async () => {
    reportServiceMock = {
      deleteReport: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentDeleteComponent],
      providers: [{ provide: ReportService, useValue: reportServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentDeleteComponent);
    component = fixture.componentInstance;
    component.report = { informe_id: 10, tipo_informe: 'Técnico' } as any;
    fixture.detectChanges();
  });

  it('onDelete llama deleteReport con el id correcto', () => {
    component.onDelete();
    expect(reportServiceMock.deleteReport).toHaveBeenCalledWith(10);
  });

  it('onDelete exitoso emite reportDeleted y close', () => {
    const deleted: void[] = [];
    const closed: void[] = [];
    component.reportDeleted.subscribe(() => deleted.push());
    component.close.subscribe(() => closed.push());
    component.onDelete();
    expect(deleted.length).toBe(1);
    expect(closed.length).toBe(1);
  });

  it('onDelete error sets error signal', () => {
    reportServiceMock.deleteReport.mockReturnValue(throwError(() => new Error('fail')));
    component.onDelete();
    expect(component.error()).toContain('Error al eliminar');
    expect(component.isDeleting()).toBe(false);
  });

  it('onCancel emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push());
    component.onCancel();
    expect(emitted.length).toBe(1);
  });
});
