import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ClientService, Client } from '../../services/client.service';

@Component({
  selector: 'app-client-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-edit.component.html',
})
export class ClientEditComponent implements OnInit {
  @Input() client!: Client;
  @Output() close = new EventEmitter<void>();
  @Output() clientUpdated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private sanitizer = inject(DomSanitizer);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  copySuccess = signal(false);
  coordParseError = signal(false);

  types = ['Corporativo', 'Residencial', 'Gobierno'];
  clientForm!: FormGroup;

  // Map state
  embedMapUrl = signal<SafeResourceUrl | null>(null);
  googleMapsLink = signal<string>('');
  hasCoordinates = signal(false);

  // Text shown in the paste field
  coordPasteValue = signal('');

  ngOnInit(): void {
    if (!this.client) {
      console.error('ClientEditComponent requires a client input');
      this.close.emit();
      return;
    }
    this.initForm();

    // If client already has coordinates, load them
    const lat = this.client.latitud ? Number(this.client.latitud) : null;
    const lng = this.client.longitud ? Number(this.client.longitud) : null;
    if (lat !== null && lng !== null) {
      this.coordPasteValue.set(`${lat}, ${lng}`);
      this.updateMap(lat, lng);
    }
  }

  initForm() {
    this.clientForm = this.fb.group({
      tipo_cliente: [this.client.tipo_cliente || 'Corporativo', Validators.required],
      dni: [this.client.dni || '', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      ruc: [this.client.ruc || '', [Validators.pattern(/^\d{11}$/)]],
      ubicacion: [this.client.ubicacion || '', Validators.required],
      latitud: [this.client.latitud ?? null],
      longitud: [this.client.longitud ?? null],
      contacto_telefono: [this.client.contacto_telefono || '', Validators.required],
      contacto_nombre: [this.client.contacto_nombre || '', Validators.required],
      contacto_apellido: [this.client.contacto_apellido || ''],
      contacto_correo: [this.client.contacto_correo || '', [Validators.required, Validators.email]],
    });
  }

  /**
   * Called when user types/pastes into the coordinates text field.
   * Accepts formats like: "-12.0898, -77.0101" or "-12.0898 -77.0101"
   */
  onCoordPaste(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    this.coordPasteValue.set(input);
    this.coordParseError.set(false);

    if (!input.trim()) {
      // Clear coordinates
      this.clientForm.patchValue({ latitud: null, longitud: null });
      this.hasCoordinates.set(false);
      this.embedMapUrl.set(null);
      return;
    }

    // Parse: split by comma, or by whitespace
    const parts = input.trim().split(/[\s,;]+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        this.clientForm.patchValue({ latitud: lat, longitud: lng });
        this.clientForm.markAsDirty();
        this.updateMap(lat, lng);
        return;
      }
    }

    // If we got here, parse failed
    this.coordParseError.set(true);
    this.clientForm.patchValue({ latitud: null, longitud: null });
    this.hasCoordinates.set(false);
    this.embedMapUrl.set(null);
  }

  updateMap(lat: number, lng: number) {
    this.hasCoordinates.set(true);
    // Google Maps Embed — free, no API key needed
    const url = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed&hl=es`;
    this.embedMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    this.googleMapsLink.set(`https://www.google.com/maps?q=${lat},${lng}`);
  }

  async copyCoordinates() {
    const lat = this.clientForm.get('latitud')?.value;
    const lng = this.clientForm.get('longitud')?.value;
    if (lat != null && lng != null) {
      const text = `${lat}, ${lng}`;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    }
  }

  openInGoogleMaps() {
    if (this.googleMapsLink()) window.open(this.googleMapsLink(), '_blank');
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.clientForm.value;

    // Ensure lat/lng are numbers or null (not empty string)
    const payload = {
      ...formValue,
      latitud: formValue.latitud !== '' ? formValue.latitud : null,
      longitud: formValue.longitud !== '' ? formValue.longitud : null,
      ruc: formValue.ruc || null,
      contacto_apellido: formValue.contacto_apellido || null,
    };

    this.clientService.updateClient(this.client.cliente_id, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.clientUpdated.emit();
        this.close.emit();
      },
      error: (err: any) => {
        console.error('Error updating client', err);
        this.isSubmitting.set(false);
        this.errorMessage.set('Error al actualizar el cliente. Verifique los datos o intente nuevamente.');
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
