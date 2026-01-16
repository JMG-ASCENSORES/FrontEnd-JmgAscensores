import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  types = ['Corporativo', 'Residencial', 'Gobierno'];
  clientForm!: FormGroup;

  ngOnInit(): void {
    if (!this.client) {
      console.error('ClientEditComponent requires a client input');
      this.close.emit();
      return;
    }
    this.initForm();
  }

  initForm() {
    this.clientForm = this.fb.group({
      tipo_cliente: [this.client.tipo_cliente || 'Corporativo', Validators.required],
      dni: [this.client.dni || '', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      ruc: [this.client.ruc || '', [Validators.pattern(/^\d{11}$/)]],

      ubicacion: [this.client.ubicacion || '', Validators.required],
      contacto_telefono: [this.client.contacto_telefono || '', Validators.required],
      contacto_nombre: [this.client.contacto_nombre || '', Validators.required],
      contacto_apellido: [this.client.contacto_apellido || ''], 
      contacto_correo: [this.client.contacto_correo || '', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.clientForm.value;

    this.clientService.updateClient(this.client.cliente_id, formValue).subscribe({
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
