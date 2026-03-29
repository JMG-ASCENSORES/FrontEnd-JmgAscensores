import { Component, EventEmitter, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService } from '../../services/client.service';
import { ModalWrapperComponent } from '../../../../shared/components/modal-wrapper/modal-wrapper.component';

@Component({
  selector: 'app-client-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalWrapperComponent],
  templateUrl: './client-create.component.html',
})
export class ClientCreateComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() clientCreated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  types = [
    { value: 'empresa', label: 'Empresa' },
    { value: 'persona', label: 'Persona Natural' }
  ];

  clientForm: FormGroup = this.fb.group({
    tipo_cliente: ['empresa', Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    nombre_comercial: ['', [Validators.required, Validators.minLength(2)]],
    distrito: [''],
    ubicacion: ['', Validators.required],
    contacto_telefono: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
    contacto_nombre: ['', [Validators.required, Validators.minLength(2)]],
    contacto_apellido: [''], 
    contacto_correo: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]]
  });

  ngOnInit(): void {
    // Escuchar cambios de tipo de cliente para manejar campos dinámicamente
    this.clientForm.get('tipo_cliente')?.valueChanges.subscribe(tipo => {
      const rucControl = this.clientForm.get('ruc');
      const nombreControl = this.clientForm.get('nombre_comercial');
      
      if (tipo === 'persona') {
        rucControl?.clearValidators();
        rucControl?.setValue(null);
        
        nombreControl?.clearValidators();
        nombreControl?.setValue(null);
      } else {
        rucControl?.setValidators([Validators.required, Validators.pattern(/^\d{11}$/)]);
        nombreControl?.setValidators([Validators.required, Validators.minLength(2)]);
      }
      rucControl?.updateValueAndValidity();
      nombreControl?.updateValueAndValidity();
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

    // Sanitize payload: valid backend might reject empty strings for unique fields like RUC
    // Mapeo inteligente de teléfonos حسب el tipo de cliente
    const payload = {
      ...formValue,
      telefono: formValue.tipo_cliente === 'persona' ? formValue.contacto_telefono : null,
      contacto_telefono: formValue.tipo_cliente === 'empresa' ? formValue.contacto_telefono : formValue.contacto_telefono, // Mantenemos el fallback para el backend si es necesario
      ruc: formValue.ruc ? formValue.ruc : null,
      nombre_comercial: formValue.nombre_comercial ? formValue.nombre_comercial : null,
      distrito: formValue.distrito ? formValue.distrito : null,
      contacto_apellido: formValue.contacto_apellido ? formValue.contacto_apellido : null
    };

    // Si es persona, nos aseguramos de que el teléfono principal esté cargado
    if (formValue.tipo_cliente === 'persona') {
        payload.contacto_telefono = null; // Unificamos: persona solo usa 'telefono'
    }

    // Remove unused form controls from payload if necessary, or just rely on sanitation above
    // delete payload.contacto_telefono; 

    this.clientService.createClient(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.clientCreated.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error creating client', err);
        this.isSubmitting.set(false);
        
        let msg = 'Error al registrar el cliente. Verifique los datos o intente nuevamente.';
        
        if (err.error) {
          if (err.error.message) {
             msg = err.error.message;
          } else if (typeof err.error === 'string') {
             msg = err.error;
          }

          // Handle array of errors or object of errors (common in many backends)
          if (err.error.errors) {
            const errors = err.error.errors;
            if (Array.isArray(errors)) {
               msg += `: ${errors.join(', ')}`;
            } else if (typeof errors === 'object') {
               const detailedErrors = Object.values(errors).flat().join(', ');
               msg += `: ${detailedErrors}`;
            }
          }
        }
        
        this.errorMessage.set(msg);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
