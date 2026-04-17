import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PdfPreviewComponent } from './pdf-preview.component';

describe('PdfPreviewComponent', () => {
  let component: PdfPreviewComponent;
  let fixture: ComponentFixture<PdfPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfPreviewComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfPreviewComponent);
    component = fixture.componentInstance;
    component.pdfUrl = 'blob:http://localhost/test' as any;
    fixture.detectChanges();
  });

  it('tiene fileName por defecto "documento.pdf"', () => {
    expect(component.fileName).toBe('documento.pdf');
  });

  it('acepta pdfUrl y downloadUrl como inputs', () => {
    component.downloadUrl = 'http://test.com/doc.pdf';
    expect(component.downloadUrl).toBe('http://test.com/doc.pdf');
  });

  it('emite close al llamar close.emit', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push());
    component.close.emit();
    expect(emitted.length).toBe(1);
  });
});
