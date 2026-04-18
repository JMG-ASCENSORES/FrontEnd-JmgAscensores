import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { WorkerReportCreateComponent } from './worker-report-create.component';
import { ClientService } from '../../../admin/services/client.service';
import { ReportService } from '../../../admin/services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WorkerService } from '../../services/worker.service';

vi.mock('signature_pad', () => ({
  default: vi.fn().mockImplementation(() => ({
    clear: vi.fn(),
    isEmpty: vi.fn().mockReturnValue(true),
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
  })),
}));

describe('WorkerReportCreateComponent', () => {
  let component: WorkerReportCreateComponent;
  let fixture: ComponentFixture<WorkerReportCreateComponent>;
  let clientServiceMock: any;
  let reportServiceMock: any;
  let authServiceMock: any;
  let workerServiceMock: any;

  const mockClients = [{ cliente_id: 1, nombre_comercial: 'Empresa A' }];
  const mockElevators = [{ ascensor_id: 5, cliente_id: 1, tipo_equipo: 'Hidráulico', marca: 'Otis' }];

  beforeEach(async () => {
    clientServiceMock = {
      getClients: vi.fn().mockReturnValue(of(mockClients)),
      getElevators: vi.fn().mockReturnValue(of(mockElevators)),
    };
    reportServiceMock = {
      createReport: vi.fn().mockReturnValue(of({})),
      updateReport: vi.fn().mockReturnValue(of({})),
      getReportById: vi.fn().mockReturnValue(of({})),
      getReports: vi.fn().mockReturnValue(of({ informes: [], meta: {} })),
      getWorkOrderById: vi.fn().mockReturnValue(of({ detalles: [] })),
    };
    authServiceMock = {
      currentUser: vi.fn().mockReturnValue({ id: 10 }),
    };
    workerServiceMock = {
      getMyProfile: vi.fn().mockReturnValue(of({ firma_defecto_id: null })),
    };

    await TestBed.configureTestingModule({
      imports: [WorkerReportCreateComponent],
      providers: [
        { provide: ClientService, useValue: clientServiceMock },
        { provide: ReportService, useValue: reportServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: WorkerService, useValue: workerServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    // Spy on prototype BEFORE createComponent — Ivy registers hooks at class level
    vi.spyOn(WorkerReportCreateComponent.prototype as any, 'ngAfterViewInit').mockImplementation(function() {});

    fixture = TestBed.createComponent(WorkerReportCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('inicializa tipo_informe en "Técnico"', () => {
    expect(component.createForm.get('tipo_informe')?.value).toBe('Técnico');
  });

  it('inicializa hora_informe en "12:00"', () => {
    expect(component.createForm.get('hora_informe')?.value).toBe('12:00');
  });

  it('isSubmitting inicia en false', () => {
    expect(component.isSubmitting()).toBe(false);
  });

  it('isMaintenanceReport inicia en false', () => {
    expect(component.isMaintenanceReport()).toBe(false);
  });

  it('carga clientes y ascensores al iniciar', () => {
    expect(clientServiceMock.getClients).toHaveBeenCalled();
    expect(clientServiceMock.getElevators).toHaveBeenCalled();
  });

  it('onSubmit con formulario inválido no llama createReport', () => {
    component.onSubmit();
    expect(reportServiceMock.createReport).not.toHaveBeenCalled();
  });

  it('onClose emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push(undefined));
    component.onClose();
    expect(emitted.length).toBe(1);
  });

  it('selectClient actualiza form y filtra ascensores', () => {
    component.allElevators.set(mockElevators as any);
    reportServiceMock.getReports.mockReturnValue(of({ informes: [], meta: {} }));
    component.selectClient(mockClients[0] as any);
    expect(component.createForm.get('cliente_id')?.value).toBe(1);
    expect(component.clientElevators().length).toBe(1);
  });

  it('onClientSearch con menos de 2 caracteres no filtra', () => {
    component.clients.set(mockClients as any);
    const event = { target: { value: 'A' } } as any;
    component.onClientSearch(event);
    expect(component.filteredClients().length).toBe(0);
  });

  it('onClientSearch con 2+ caracteres filtra clientes', () => {
    component.clients.set(mockClients as any);
    const event = { target: { value: 'empresa' } } as any;
    component.onClientSearch(event);
    expect(component.filteredClients().length).toBe(1);
  });

  it('groupedChecklist agrupa tareas por categoría', () => {
    component.maintenanceChecklist.set([
      { TareaMaestra: { categoria: 'Motor' }, realizado: false },
      { TareaMaestra: { categoria: 'Motor' }, realizado: true },
      { TareaMaestra: { categoria: 'Puerta' }, realizado: false },
    ] as any);
    const groups = component.groupedChecklist;
    expect(groups.length).toBe(2);
    expect(groups.find(g => g.categoria === 'Motor')?.tasks.length).toBe(2);
  });

  it('toggleTask invierte el estado realizado', () => {
    const task = { realizado: false };
    component.toggleTask(task);
    expect(task.realizado).toBe(true);
  });

  it('isCategoryComplete retorna true cuando todas las tareas están realizadas', () => {
    const group = { categoria: 'Motor', tasks: [{ realizado: true }, { realizado: true }] };
    expect(component.isCategoryComplete(group)).toBe(true);
  });

  it('isCategoryComplete retorna false si alguna tarea no está realizada', () => {
    const group = { categoria: 'Motor', tasks: [{ realizado: true }, { realizado: false }] };
    expect(component.isCategoryComplete(group)).toBe(false);
  });
});
