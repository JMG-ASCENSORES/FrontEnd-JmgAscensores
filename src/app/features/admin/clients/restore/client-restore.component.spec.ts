import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ClientRestoreComponent } from './client-restore.component';
import { ClientService } from '../../services/client.service';

describe('ClientRestoreComponent', () => {
  let component: ClientRestoreComponent;
  let fixture: ComponentFixture<ClientRestoreComponent>;
  let clientServiceMock: any;

  const mockClients = [
    { cliente_id: 1, nombre_comercial: 'Inactivo SA' },
  ];

  beforeEach(async () => {
    clientServiceMock = {
      getClients: vi.fn().mockReturnValue(of(mockClients)),
      updateClient: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [ClientRestoreComponent],
      providers: [{ provide: ClientService, useValue: clientServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientRestoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga clientes inactivos al iniciar', () => {
    expect(clientServiceMock.getClients).toHaveBeenCalledWith({ estado_activo: false });
    expect(component.inactiveClients()).toEqual(mockClients);
    expect(component.isLoading()).toBe(false);
  });

  it('sets error cuando loadInactiveClients falla', () => {
    clientServiceMock.getClients.mockReturnValue(throwError(() => new Error('fail')));
    component.loadInactiveClients();
    expect(component.error()).toBe('No se pudieron cargar los clientes inactivos.');
    expect(component.isLoading()).toBe(false);
  });

  it('initiateRestore sets confirmingId', () => {
    component.initiateRestore(5);
    expect(component.confirmingId()).toBe(5);
  });

  it('cancelRestore limpia confirmingId', () => {
    component.confirmingId.set(5);
    component.cancelRestore();
    expect(component.confirmingId()).toBeNull();
  });

  it('confirmRestore llama updateClient con estado_activo=true y emite clientRestored', () => {
    const emitted: void[] = [];
    component.clientRestored.subscribe(() => emitted.push(undefined));
    const client = { cliente_id: 1, nombre_comercial: 'Test' } as any;
    component.confirmRestore(client);
    expect(clientServiceMock.updateClient).toHaveBeenCalledWith(1, { estado_activo: true });
    expect(emitted.length).toBe(1);
  });

  it('confirmRestore error no emite clientRestored', () => {
    clientServiceMock.updateClient.mockReturnValue(throwError(() => new Error('fail')));
    const emitted: void[] = [];
    component.clientRestored.subscribe(() => emitted.push(undefined));
    const client = { cliente_id: 1 } as any;
    component.confirmRestore(client);
    expect(emitted.length).toBe(0);
    expect(component.isProcessing()).toBe(false);
  });

  it('onClose emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push(undefined));
    component.onClose();
    expect(emitted.length).toBe(1);
  });
});
