import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ClientCreateComponent } from './client-create.component';
import { ClientService } from '../../services/client.service';

describe('ClientCreateComponent', () => {
  let component: ClientCreateComponent;
  let fixture: ComponentFixture<ClientCreateComponent>;
  let clientServiceMock: any;

  beforeEach(async () => {
    clientServiceMock = {
      createClient: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [ClientCreateComponent, ReactiveFormsModule],
      providers: [{ provide: ClientService, useValue: clientServiceMock }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ClientCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize clientForm with default values', () => {
    expect(component.clientForm).toBeDefined();
    expect(component.clientForm.get('tipo_cliente')?.value).toBe('empresa');
  });

  it('onSubmit() should not call createClient when form is invalid', () => {
    component.onSubmit();
    expect(clientServiceMock.createClient).not.toHaveBeenCalled();
  });

  it('onSubmit() should emit clientCreated and close on success', () => {
    const closeSpy = vi.spyOn(component.close, 'emit');
    const createdSpy = vi.spyOn(component.clientCreated, 'emit');

    component.clientForm.patchValue({
      tipo_cliente: 'empresa',
      dni: '12345678',
      ruc: '12345678901',
      nombre_comercial: 'Empresa Test',
      ubicacion: 'Lima',
      contacto_telefono: '987654321',
      contacto_nombre: 'Juan',
      contacto_correo: 'juan@test.com'
    });

    component.onSubmit();
    expect(clientServiceMock.createClient).toHaveBeenCalled();
    expect(createdSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('onSubmit() should set errorMessage on service error', () => {
    clientServiceMock.createClient.mockReturnValue(throwError(() => ({ error: { message: 'Error al crear' } })));

    component.clientForm.patchValue({
      tipo_cliente: 'empresa',
      dni: '12345678',
      ruc: '12345678901',
      nombre_comercial: 'Empresa Test',
      ubicacion: 'Lima',
      contacto_telefono: '987654321',
      contacto_nombre: 'Juan',
      contacto_correo: 'juan@test.com'
    });

    component.onSubmit();
    expect(component.errorMessage()).toBe('Error al crear');
  });

  it('onClose() should emit close event', () => {
    const closeSpy = vi.spyOn(component.close, 'emit');
    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('tipo_cliente change to persona should clear ruc and nombre_comercial validators', () => {
    component.clientForm.get('tipo_cliente')?.setValue('persona');
    expect(component.clientForm.get('ruc')?.validator).toBeNull();
    expect(component.clientForm.get('nombre_comercial')?.validator).toBeNull();
  });

  it('should set isSubmitting to false after successful submit', () => {
    component.clientForm.patchValue({
      tipo_cliente: 'empresa',
      dni: '12345678',
      ruc: '12345678901',
      nombre_comercial: 'Empresa Test',
      ubicacion: 'Lima',
      contacto_telefono: '987654321',
      contacto_nombre: 'Juan',
      contacto_correo: 'juan@test.com'
    });
    component.onSubmit();
    expect(component.isSubmitting()).toBe(false);
  });
});
