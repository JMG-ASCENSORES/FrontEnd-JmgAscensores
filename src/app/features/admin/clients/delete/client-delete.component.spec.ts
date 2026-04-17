import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ClientDeleteComponent } from './client-delete.component';
import { ClientService } from '../../services/client.service';

const mockClient: any = {
  cliente_id: 5,
  nombre_comercial: 'Test Corp',
  tipo_cliente: 'empresa'
};

describe('ClientDeleteComponent', () => {
  let component: ClientDeleteComponent;
  let fixture: ComponentFixture<ClientDeleteComponent>;
  let clientServiceMock: any;

  beforeEach(async () => {
    clientServiceMock = {
      deleteClient: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [ClientDeleteComponent],
      providers: [{ provide: ClientService, useValue: clientServiceMock }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ClientDeleteComponent);
    component = fixture.componentInstance;
    component.client = mockClient;
    fixture.detectChanges();
  });

  it('onDelete() should call deleteClient with client.cliente_id', () => {
    component.onDelete();
    expect(clientServiceMock.deleteClient).toHaveBeenCalledWith(5);
  });

  it('onDelete() should emit clientDeleted and close on success', () => {
    const deletedSpy = vi.spyOn(component.clientDeleted, 'emit');
    const closeSpy = vi.spyOn(component.close, 'emit');

    component.onDelete();
    expect(deletedSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('onDelete() should set errorMessage on service error', () => {
    clientServiceMock.deleteClient.mockReturnValue(throwError(() => new Error('Delete failed')));
    component.onDelete();
    expect(component.errorMessage()).toBe('Error al eliminar. Inténtelo de nuevo.');
  });

  it('onDelete() should set isDeleting to false after error', () => {
    clientServiceMock.deleteClient.mockReturnValue(throwError(() => new Error('error')));
    component.onDelete();
    expect(component.isDeleting()).toBe(false);
  });

  it('onClose() should emit close event', () => {
    const closeSpy = vi.spyOn(component.close, 'emit');
    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('onDelete() should do nothing if client has no cliente_id', () => {
    component.client = { ...mockClient, cliente_id: undefined } as any;
    component.onDelete();
    expect(clientServiceMock.deleteClient).not.toHaveBeenCalled();
  });
});
