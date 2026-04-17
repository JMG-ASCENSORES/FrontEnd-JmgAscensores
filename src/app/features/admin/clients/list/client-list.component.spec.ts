import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ClientListComponent } from './client-list.component';
import { ClientService } from '../../services/client.service';

describe('ClientListComponent', () => {
  let component: ClientListComponent;
  let fixture: ComponentFixture<ClientListComponent>;
  let clientServiceMock: any;

  const mockPaginatedResponse = {
    data: [
      { cliente_id: 1, nombre_comercial: 'Acme SA', estado_activo: true, tipo_cliente: 'empresa' },
      { cliente_id: 2, nombre_comercial: 'Beta SRL', estado_activo: true, tipo_cliente: 'persona' },
    ],
    meta: { totalItems: 2, totalPages: 1, currentPage: 1, itemsPerPage: 12 },
  };

  const mockStats = {
    data: { total_clientes: 5, total_ascensores: 10, total_montacargas: 2, total_plataformas: 1 },
  };

  beforeEach(async () => {
    clientServiceMock = {
      getClientsPaginated: vi.fn().mockReturnValue(of(mockPaginatedResponse)),
      getClientStats: vi.fn().mockReturnValue(of(mockStats)),
      deleteClient: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [ClientListComponent],
      providers: [{ provide: ClientService, useValue: clientServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga datos y estadísticas al iniciar', () => {
    expect(clientServiceMock.getClientsPaginated).toHaveBeenCalled();
    expect(clientServiceMock.getClientStats).toHaveBeenCalled();
    expect(component.clients().length).toBe(2);
    expect(component.totalClients()).toBe(5);
    expect(component.isLoading()).toBe(false);
  });

  it('sets error cuando loadData falla', () => {
    clientServiceMock.getClientsPaginated.mockReturnValue(throwError(() => new Error('fail')));
    component.loadData();
    expect(component.error()).toBeTruthy();
    expect(component.isLoading()).toBe(false);
  });

  it('nextPage incrementa currentPage si < totalPages', () => {
    component.currentPage.set(1);
    component.totalPages.set(3);
    component.nextPage();
    expect(component.currentPage()).toBe(2);
  });

  it('nextPage no incrementa si ya está en última página', () => {
    component.currentPage.set(3);
    component.totalPages.set(3);
    component.nextPage();
    expect(component.currentPage()).toBe(3);
  });

  it('prevPage decrementa currentPage si > 1', () => {
    component.currentPage.set(2);
    component.prevPage();
    expect(component.currentPage()).toBe(1);
  });

  it('prevPage no decrementa si está en primera página', () => {
    component.currentPage.set(1);
    component.prevPage();
    expect(component.currentPage()).toBe(1);
  });

  it('openCreateModal sets showCreateModal=true', () => {
    component.openCreateModal();
    expect(component.showCreateModal()).toBe(true);
  });

  it('closeCreateModal sets showCreateModal=false', () => {
    component.showCreateModal.set(true);
    component.closeCreateModal();
    expect(component.showCreateModal()).toBe(false);
  });

  it('openEditModal sets selectedClient y showEditModal=true', () => {
    const client = mockPaginatedResponse.data[0] as any;
    component.openEditModal(client);
    expect(component.selectedClient()).toEqual(client);
    expect(component.showEditModal()).toBe(true);
  });

  it('closeDeleteModal limpia selectedClient', () => {
    component.selectedClient.set(mockPaginatedResponse.data[0] as any);
    component.closeDeleteModal();
    expect(component.selectedClient()).toBeNull();
  });

  it('filteredClients excluye clientes inactivos', () => {
    component.clients.set([
      { cliente_id: 1, nombre_comercial: 'Activo', estado_activo: true } as any,
      { cliente_id: 2, nombre_comercial: 'Inactivo', estado_activo: false } as any,
    ]);
    expect(component.filteredClients().length).toBe(1);
  });

  it('getInitials retorna las primeras 2 letras en mayúscula', () => {
    expect(component.getInitials('Empresa Central')).toBe('EM');
    expect(component.getInitials(undefined)).toBe('?');
  });

  it('onFilterChange resetea currentPage a 1 y llama loadData', () => {
    component.currentPage.set(3);
    component.onFilterChange();
    expect(component.currentPage()).toBe(1);
    expect(clientServiceMock.getClientsPaginated).toHaveBeenCalled();
  });
});
