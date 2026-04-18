import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { DocumentFormComponent } from './document-form.component';
import { ClientService } from '../../services/client.service';
import { TechnicianService } from '../../services/technician.service';
import { ReportService } from '../../services/report.service';

describe('DocumentFormComponent', () => {
  let component: DocumentFormComponent;
  let fixture: ComponentFixture<DocumentFormComponent>;
  let clientServiceMock: any;
  let techServiceMock: any;
  let reportServiceMock: any;

  const mockClients = [{ cliente_id: 1, nombre_comercial: 'Empresa A' }];
  const mockTechs = [{ id: 2, nombre: 'Carlos', apellido: 'López', especialidad: 'Técnico General' }];
  const mockElevators = [{ ascensor_id: 5, cliente_id: 1, tipo_equipo: 'Hidráulico', marca: 'Otis' }];

  beforeEach(async () => {
    clientServiceMock = {
      getClients: vi.fn().mockReturnValue(of(mockClients)),
      getElevators: vi.fn().mockReturnValue(of(mockElevators)),
    };
    techServiceMock = {
      getTechnicians: vi.fn().mockReturnValue(of(mockTechs)),
    };
    reportServiceMock = {
      createReport: vi.fn().mockReturnValue(of({})),
      patchReport: vi.fn().mockReturnValue(of({})),
      getReportById: vi.fn().mockReturnValue(of({ informe_id: 1, tipo_informe: 'Técnico', cliente_id: 1, ascensor_id: 5, trabajador_id: 2 })),
      getStandardTasks: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentFormComponent],
      providers: [
        { provide: ClientService, useValue: clientServiceMock },
        { provide: TechnicianService, useValue: techServiceMock },
        { provide: ReportService, useValue: reportServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('tiene tipo_informe "Técnico" por defecto', () => {
    expect(component.form.get('tipo_informe')?.value).toBe('Técnico');
  });

  it('tiene hora_informe "12:00" por defecto', () => {
    expect(component.form.get('hora_informe')?.value).toBe('12:00');
  });

  it('carga clientes, técnicos y ascensores al iniciar', () => {
    expect(clientServiceMock.getClients).toHaveBeenCalled();
    expect(techServiceMock.getTechnicians).toHaveBeenCalledWith({ estado_activo: true });
    expect(clientServiceMock.getElevators).toHaveBeenCalled();
  });

  it('onSubmit con formulario inválido no llama createReport', () => {
    component.onSubmit();
    expect(reportServiceMock.createReport).not.toHaveBeenCalled();
  });

  it('onSubmit exitoso en modo create llama createReport y emite saved y close', () => {
    const saved: void[] = [];
    const closed: void[] = [];
    component.saved.subscribe(() => saved.push(undefined));
    component.close.subscribe(() => closed.push(undefined));

    component.clients.set(mockClients as any);
    component.allElevators.set(mockElevators as any);
    component.technicians.set(mockTechs as any);

    component.form.patchValue({
      cliente_id: 1,
      ascensor_id: 5,
      trabajador_id: 2,
      tipo_informe: 'Técnico',
      descripcion_trabajo: 'Descripción de prueba larga suficiente',
      fecha_informe: '2024-01-15',
      hora_informe: '10:00',
    });

    component.onSubmit();
    expect(reportServiceMock.createReport).toHaveBeenCalled();
    expect(saved.length).toBe(1);
    expect(closed.length).toBe(1);
  });

  it('onSubmit error sets error signal', () => {
    reportServiceMock.createReport.mockReturnValue(throwError(() => new Error('fail')));

    component.clients.set(mockClients as any);
    component.allElevators.set(mockElevators as any);
    component.technicians.set(mockTechs as any);

    component.form.patchValue({
      cliente_id: 1,
      ascensor_id: 5,
      trabajador_id: 2,
      tipo_informe: 'Técnico',
      descripcion_trabajo: 'Descripción de prueba larga suficiente',
      fecha_informe: '2024-01-15',
      hora_informe: '10:00',
    });

    component.onSubmit();
    expect(component.error()).toContain('Error al crear');
    expect(component.isSubmitting()).toBe(false);
  });

  it('onClose emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push(undefined));
    component.onClose();
    expect(emitted.length).toBe(1);
  });

  it('filterElevators filtra ascensores por cliente', () => {
    component.allElevators.set(mockElevators as any);
    component.filterElevators(1);
    expect(component.clientElevators().length).toBe(1);
  });

  it('filterElevators con clientId vacío limpia ascensores', () => {
    component.filterElevators('');
    expect(component.clientElevators().length).toBe(0);
  });

  it('displayClient retorna nombre_comercial', () => {
    expect(component.displayClient(mockClients[0] as any)).toBe('Empresa A');
  });

  it('displayTech retorna nombre completo', () => {
    expect(component.displayTech(mockTechs[0] as any)).toBe('Carlos López');
  });
});
