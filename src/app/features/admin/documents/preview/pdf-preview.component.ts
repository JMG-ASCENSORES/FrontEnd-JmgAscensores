import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-preview.component.html',
  styleUrl: './pdf-preview.component.scss'
})
export class PdfPreviewComponent {
  @Input({ required: true }) pdfUrl!: SafeResourceUrl;
  @Input() downloadUrl: string | null = null;
  @Input() fileName: string = 'documento.pdf';
  @Output() close = new EventEmitter<void>();

  download() {
    // Determine if pdfUrl is SafeResourceUrl or string. 
    // In Angular, SafeResourceUrl is an object wrapper. We need the actual string for the anchor tag if possible, 
    // or we can assume the user clicks "Download" which triggers a programmatic download or uses the native toolbar.
    
    // However, since we have the blob URL in the iframe, the native PDF viewer usually has a download button.
    // But the user *explicitly* asked for "option to download definitely".
    // So we'll add a clear button.
    
    // To download programmatically from a SafeResourceUrl is tricky because we can't easily unwrap it without the sanitizer (which is weird to inject just to unwrap).
    // Better strategy: The parent passes the raw BlobURL (string) AND the SafeResourceUrl.
    // Or simpler: The component receives the SafeResourceUrl for the iframe.
    // For the download button, we can use a separate input 'downloadUrl' (string).
  }
}
