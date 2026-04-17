import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ClientEditComponent } from './client-edit.component';
import { ClientService } from '../../services/client.service';

const mockClient: any = {
  cliente_id: 1,
  tipo_cliente: 'empresa',
  nombre_comercial: 'Test Corp',
  dni: '12345678',
  ruc: '12345678901',
  ubicacion: 'Lima',
  distrito: 'Miraflores',
  latitud: null,
  longitud: null,
  contacto_telefono: '987654321',
  contacto_nombre: 'Pedro',
  contacto_apellido: 'Gomez',
  contacto_correo: 'pedro@test.com',
  estado_activo: true
};

describe('ClientEditComponent', () => {
  let component: ClientEditComponent;
  let fixture: ComponentFixture<ClientEditComponent>;
  let clientServiceMock: any;

  beforeEach(async () => {
    clientServiceMock = {
      updateClient: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [ClientEditComponent, ReactiveFormsModule],
      providers: [{ provide: ClientService, useValue: clientServiceMock }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ClientEditComponent);
    component = fixture.componentInstance;
    component.client = mockClient;
    fixture.detectChanges();
  });

  it('should initialize form with client data', () => {
    expect(component.clientForm).toBeDefined();
    expect(component.clientForm.get('nombre_comercial')?.value).toBe('Test Corp');
    expect(component.clientForm.get('tipo_cliente')?.value).toBe('empresa');
  });

  it('onSubmit() should not call updateClient when form is invalid', () => {
    component.clientForm.get('contacto_nombre')?.setValue('');
    component.onSubmit();
    expect(clientServiceMock.updateClient).not.toHaveBeenCalled();
  });

  it('onSubmit() should call updateClient with client.cliente_id on valid form', () => {
    const updatedSpy = vi.spyOn(component.clientUpdated, 'emit');
    const closeSpy = vi.spyOn(component.close, 'emit');

    component.onSubmit();
    expect(clientServiceMock.updateClient).toHaveBeenCalledWith(1, expect.any(Object));
    expect(updatedSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('onSubmit() should set errorMessage on service error', () => {
    clientServiceMock.updateClient.mockReturnValue(throwError(() => new Error('error')));
    component.onSubmit();
    expect(component.errorMessage()).toBe('Error al actualizar el cliente. Verifique los datos o intente nuevamente.');
  });

  it('onClose() should emit close', () => {
    const closeSpy = vi.spyOn(component.close, 'emit');
    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('onCoordPaste() should parse valid coordinates', () => {
    const event = { target: { value: '-12.0898, -77.0101' } } as any;
    component.onCoordPaste(event);
    expect(component.hasCoordinates()).toBe(true);
    expect(component.coordParseError()).toBe(false);
  });

  it('onCoordPaste() should set coordParseError on invalid input', () => {
    const event = { target: { value: 'invalid,data' } } as any;
    component.onCoordPaste(event);
    expect(component.coordParseError()).toBe(true);
    expect(component.hasCoordinates()).toBe(false);
  });

  it('onCoordPaste() should clear coordinates on empty input', () => {
    const event = { target: { value: '' } } as any;
    component.onCoordPaste(event);
    expect(component.hasCoordinates()).toBe(false);
  });
});
