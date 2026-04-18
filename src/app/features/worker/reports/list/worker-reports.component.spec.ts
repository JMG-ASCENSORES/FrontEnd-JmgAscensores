import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { WorkerReportsComponent } from './worker-reports.component';
import { ReportService } from '../../../admin/services/report.service';
import { ClientService } from '../../../admin/services/client.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DomSanitizer } from '@angular/platform-browser';

const mockUser = { id: 1, tipo: 'trabajador', nombre: 'Test Worker' };
const mockClients = [
  { cliente_id: 1, nombre_comercial: 'Cliente A', contacto_nombre: 'Ana Lopez' },
  { cliente_id: 2, nombre_comercial: 'Cliente B', contacto_nombre: 'Pedro Garcia' }
];
const mockReportsResponse = {
  informes: [
    { informe_id: 1, tipo_informe: 'Mantenimiento', cliente_id: 1 },
    { informe_id: 2, tipo_informe: 'Técnico', cliente_id: 2 }
  ],
  meta: { totalPages: 3, totalItems: 25 }
};

describe('WorkerReportsComponent', () => {
  let component: WorkerReportsComponent;
  let fixture: ComponentFixture<WorkerReportsComponent>;
  let reportServiceMock: any;
  let clientServiceMock: any;
  let authServiceMock: any;
  let domSanitizerMock: any;

  beforeEach(async () => {
    reportServiceMock = {
      getReports: vi.fn().mockReturnValue(of(mockReportsResponse)),
      downloadReportPdf: vi.fn().mockReturnValue(of(new Blob()))
    };

    clientServiceMock = {
      getClients: vi.fn().mockReturnValue(of(mockClients))
    };

    authServiceMock = {
      currentUser: vi.fn().mockReturnValue(mockUser)
    };

    domSanitizerMock = {
      bypassSecurityTrustResourceUrl: vi.fn(url => url)
    };

    await TestBed.configureTestingModule({
      imports: [WorkerReportsComponent],
      providers: [
        { provide: ReportService, useValue: reportServiceMock },
        { provide: ClientService, useValue: clientServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: DomSanitizer, useValue: domSanitizerMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('loadReports()', () => {
    it('should not load reports if user is null', () => {
      authServiceMock.currentUser.mockReturnValue(null);
      reportServiceMock.getReports.mockClear();
      component.loadReports();
      expect(reportServiceMock.getReports).not.toHaveBeenCalled();
    });

    it('should not load reports if user is not a worker', () => {
      authServiceMock.currentUser.mockReturnValue({ id: 1, tipo: 'admin' });
      reportServiceMock.getReports.mockClear();
      component.loadReports();
      expect(reportServiceMock.getReports).not.toHaveBeenCalled();
    });

    it('should call reportService.getReports with correct filters', () => {
      component.loadReports();
      expect(reportServiceMock.getReports).toHaveBeenCalledWith(
        expect.objectContaining({
          trabajador_id: mockUser.id,
          page: 1,
          limit: 10
        })
      );
    });

    it('should set reports signal from response', () => {
      component.loadReports();
      expect(component.reports()).toHaveLength(2);
    });

    it('should set totalPages from response meta', () => {
      component.loadReports();
      expect(component.totalPages()).toBe(3);
    });

    it('should set isLoading to false on success', () => {
      component.loadReports();
      expect(component.isLoading()).toBe(false);
    });

    it('should set isLoading to false on error', () => {
      reportServiceMock.getReports.mockReturnValue(throwError(() => new Error('Error')));
      component.loadReports();
      expect(component.isLoading()).toBe(false);
    });

    it('should include tipo_informe filter when filterTipo is set', () => {
      component.filterTipo.set('Mantenimiento');
      component.loadReports();
      expect(reportServiceMock.getReports).toHaveBeenCalledWith(
        expect.objectContaining({ tipo_informe: 'Mantenimiento' })
      );
    });

    it('should include cliente_id filter when filterCliente is set', () => {
      component.filterCliente.set('5');
      component.loadReports();
      expect(reportServiceMock.getReports).toHaveBeenCalledWith(
        expect.objectContaining({ cliente_id: '5' })
      );
    });
  });

  describe('nextPage()', () => {
    it('should increment currentPage if less than totalPages', () => {
      component.currentPage.set(1);
      component.totalPages.set(3);
      component.nextPage();
      expect(component.currentPage()).toBe(2);
    });

    it('should not increment currentPage if at totalPages', () => {
      component.currentPage.set(3);
      component.totalPages.set(3);
      reportServiceMock.getReports.mockClear();
      component.nextPage();
      expect(component.currentPage()).toBe(3);
      expect(reportServiceMock.getReports).not.toHaveBeenCalled();
    });
  });

  describe('prevPage()', () => {
    it('should decrement currentPage if greater than 1', () => {
      component.currentPage.set(3);
      component.prevPage();
      expect(component.currentPage()).toBe(2);
    });

    it('should not decrement currentPage if at page 1', () => {
      component.currentPage.set(1);
      reportServiceMock.getReports.mockClear();
      component.prevPage();
      expect(component.currentPage()).toBe(1);
      expect(reportServiceMock.getReports).not.toHaveBeenCalled();
    });
  });

  describe('clearFilters()', () => {
    it('should reset all filters to empty string', () => {
      component.filterTipo.set('Mantenimiento');
      component.filterCliente.set('1');
      component.clientSearch.set('Cliente A');
      component.filterFechaInicio.set('2024-01-01');
      component.filterFechaFin.set('2024-12-31');
      component.clearFilters();
      expect(component.filterTipo()).toBe('');
      expect(component.filterCliente()).toBe('');
      expect(component.clientSearch()).toBe('');
      expect(component.filterFechaInicio()).toBe('');
      expect(component.filterFechaFin()).toBe('');
    });

    it('should reset currentPage to 1', () => {
      component.currentPage.set(5);
      component.clearFilters();
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('selectClient()', () => {
    it('should set filterCliente with cliente_id as string', () => {
      const client = mockClients[0];
      component.selectClient(client as any);
      expect(component.filterCliente()).toBe('1');
    });

    it('should set clientSearch with nombre_comercial', () => {
      const client = mockClients[0];
      component.selectClient(client as any);
      expect(component.clientSearch()).toBe('Cliente A');
    });

    it('should use contacto_nombre if nombre_comercial is empty', () => {
      const client = { cliente_id: 3, nombre_comercial: '', contacto_nombre: 'Pedro' };
      component.selectClient(client as any);
      expect(component.clientSearch()).toBe('Pedro');
    });
  });

  describe('getReportDisplayName()', () => {
    it("should use 'MAN' prefix for Mantenimiento reports", () => {
      const report = { informe_id: 1, tipo_informe: 'Mantenimiento', cliente_id: 1 };
      const name = component.getReportDisplayName(report as any);
      expect(name).toContain('MAN');
    });

    it("should use 'TEC' prefix for Técnico reports", () => {
      const report = { informe_id: 2, tipo_informe: 'Técnico', cliente_id: 2 };
      const name = component.getReportDisplayName(report as any);
      expect(name).toContain('TEC');
    });

    it('should pad informe_id to 6 digits', () => {
      const report = { informe_id: 42, tipo_informe: 'Técnico', cliente_id: 1 };
      const name = component.getReportDisplayName(report as any);
      expect(name).toContain('000042');
    });
  });

  describe('onClientSearch()', () => {
    it('should clear filteredClients if query is less than 2 chars', () => {
      component.filteredClients.set(mockClients as any);
      const event = { target: { value: 'A' } } as any;
      component.onClientSearch(event);
      expect(component.filteredClients()).toHaveLength(0);
    });

    it('should clear filterCliente if query is less than 2 chars', () => {
      component.filterCliente.set('1');
      const event = { target: { value: 'x' } } as any;
      component.onClientSearch(event);
      expect(component.filterCliente()).toBe('');
    });

    it('should filter clients when query is 2+ chars', () => {
      component.clients.set(mockClients as any);
      const event = { target: { value: 'cl' } } as any;
      component.onClientSearch(event);
      expect(component.filteredClients().length).toBeGreaterThan(0);
    });
  });
});
