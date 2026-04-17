import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { DocumentListComponent } from './document-list.component';
import { ReportService } from '../../services/report.service';
import { ClientService } from '../../services/client.service';
import { TechnicianService } from '../../services/technician.service';
import { DomSanitizer } from '@angular/platform-browser';

describe('DocumentListComponent', () => {
  let component: DocumentListComponent;
  let fixture: ComponentFixture<DocumentListComponent>;
  let reportServiceMock: any;
  let clientServiceMock: any;
  let techServiceMock: any;

  const mockReports = [
    { informe_id: 1, tipo_informe: 'Técnico', cliente_id: 1, trabajador_id: 2, fecha_informe: '2024-01-15' },
    { informe_id: 2, tipo_informe: 'Mantenimiento', cliente_id: 2, trabajador_id: 3, fecha_informe: '2024-01-20' },
  ];
  const mockMeta = { total: 2, totalMaintenance: 1, totalTechnical: 1, totalPages: 1 };
  const mockClients = [
    { cliente_id: 1, nombre_comercial: 'Empresa A', contacto_nombre: 'Juan', contacto_apellido: 'Pérez' },
    { cliente_id: 2, nombre_comercial: 'Empresa B' },
  ];
  const mockTechs = [{ id: 2, nombre: 'Carlos', apellido: 'López' }];

  beforeEach(async () => {
    reportServiceMock = {
      getReports: vi.fn().mockReturnValue(of({ informes: mockReports, meta: mockMeta })),
      downloadReportPdf: vi.fn().mockReturnValue(of(new Blob())),
    };
    clientServiceMock = {
      getClients: vi.fn().mockReturnValue(of(mockClients)),
    };
    techServiceMock = {
      getTechnicians: vi.fn().mockReturnValue(of(mockTechs)),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentListComponent],
      providers: [
        { provide: ReportService, useValue: reportServiceMock },
        { provide: ClientService, useValue: clientServiceMock },
        { provide: TechnicianService, useValue: techServiceMock },
        {
          provide: DomSanitizer,
          useValue: { bypassSecurityTrustResourceUrl: (url: string) => url }
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga datos al iniciar', () => {
    expect(clientServiceMock.getClients).toHaveBeenCalled();
    expect(techServiceMock.getTechnicians).toHaveBeenCalled();
    expect(reportServiceMock.getReports).toHaveBeenCalled();
    expect(component.reports().length).toBe(2);
    expect(component.isLoading()).toBe(false);
  });

  it('sets error al fallar fetchReports', () => {
    reportServiceMock.getReports.mockReturnValue(throwError(() => new Error('fail')));
    component.fetchReports();
    expect(component.error()).toContain('Error al cargar');
  });

  it('getClientName retorna nombre comercial del cliente', () => {
    component.clients.set(mockClients as any);
    expect(component.getClientName(1)).toBe('Empresa A');
    expect(component.getClientName(2)).toBe('Empresa B');
    expect(component.getClientName(99)).toBe('Desconocido');
  });

  it('getWorkerName retorna nombre del técnico', () => {
    component.technicians.set(mockTechs as any);
    expect(component.getWorkerName(2)).toBe('Carlos López');
    expect(component.getWorkerName(99)).toContain('99');
  });

  it('nextPage incrementa currentPage y recarga', () => {
    component.totalPages.set(3);
    component.currentPage.set(1);
    component.nextPage();
    expect(component.currentPage()).toBe(2);
    expect(reportServiceMock.getReports).toHaveBeenCalledTimes(2);
  });

  it('prevPage no va por debajo de 1', () => {
    component.currentPage.set(1);
    component.prevPage();
    expect(component.currentPage()).toBe(1);
  });

  it('prevPage decrementa currentPage', () => {
    component.currentPage.set(2);
    component.totalPages.set(3);
    component.prevPage();
    expect(component.currentPage()).toBe(1);
  });

  it('openCreateModal sets showFormModal=true', () => {
    component.openCreateModal();
    expect(component.showFormModal()).toBe(true);
    expect(component.formMode()).toBe('create');
  });

  it('openEditModal sets selectedReport y showFormModal=true', () => {
    component.openEditModal(mockReports[0] as any);
    expect(component.selectedReport()).toEqual(mockReports[0]);
    expect(component.formMode()).toBe('edit');
    expect(component.showFormModal()).toBe(true);
  });

  it('closeFormModal limpia selectedReport y modal', () => {
    component.selectedReport.set(mockReports[0] as any);
    component.showFormModal.set(true);
    component.closeFormModal();
    expect(component.showFormModal()).toBe(false);
    expect(component.selectedReport()).toBeNull();
  });

  it('openDeleteModal sets selectedReport y showDeleteModal=true', () => {
    component.openDeleteModal(mockReports[1] as any);
    expect(component.selectedReport()).toEqual(mockReports[1]);
    expect(component.showDeleteModal()).toBe(true);
  });

  it('closeDeleteModal limpia modal', () => {
    component.showDeleteModal.set(true);
    component.closeDeleteModal();
    expect(component.showDeleteModal()).toBe(false);
  });

  it('formatDate formatea fecha correctamente', () => {
    expect(component.formatDate('2024-01-15')).toBe('15/01/2024');
  });

  it('getReportDisplayName retorna nombre con prefijo TEC o MAN', () => {
    component.clients.set(mockClients as any);
    const tecReport = mockReports[0] as any;
    const manReport = mockReports[1] as any;
    expect(component.getReportDisplayName(tecReport)).toContain('TEC');
    expect(component.getReportDisplayName(manReport)).toContain('MAN');
  });

  it('applyFilters resetea a página 1 y recarga', () => {
    component.currentPage.set(3);
    component.applyFilters();
    expect(component.currentPage()).toBe(1);
  });

  it('filteredClients retorna vacío con menos de 2 caracteres', () => {
    component.clients.set(mockClients as any);
    component.clientSearchTerm.set('A');
    expect(component.filteredClients().length).toBe(0);
  });

  it('filteredClients filtra clientes por término', () => {
    component.clients.set(mockClients as any);
    component.clientSearchTerm.set('empresa a');
    expect(component.filteredClients().length).toBe(1);
  });
});
