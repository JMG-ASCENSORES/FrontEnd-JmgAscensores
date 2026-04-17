import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProgramacionModalComponent } from './programacion-modal.component';
import { MantenimientoService } from '../services/mantenimiento.service';
import { TechnicianService } from '../services/technician.service';
import { ClientService } from '../services/client.service';
import { ElevatorService } from '../services/elevator.service';

describe('ProgramacionModalComponent', () => {
  let component: ProgramacionModalComponent;
  let fixture: ComponentFixture<ProgramacionModalComponent>;
  let mantenimientoServiceMock: any;
  let techServiceMock: any;
  let clientServiceMock: any;
  let elevatorServiceMock: any;

  const mockTechs = [{ usuario_id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com' }];
  const mockClients = [{ cliente_id: 1, nombre_comercial: 'Empresa A' }];
  const mockElevators = [{ ascensor_id: 3, cliente_id: 1, tipo_equipo: 'Hidráulico', marca: 'Otis' }];

  beforeEach(async () => {
    mantenimientoServiceMock = {
      createMantenimiento: vi.fn().mockReturnValue(of({})),
      updateMantenimiento: vi.fn().mockReturnValue(of({})),
    };
    techServiceMock = {
      getTechnicians: vi.fn().mockReturnValue(of(mockTechs)),
    };
    clientServiceMock = {
      getClients: vi.fn().mockReturnValue(of(mockClients)),
    };
    elevatorServiceMock = {
      getElevatorsByClient: vi.fn().mockReturnValue(of(mockElevators)),
    };

    await TestBed.configureTestingModule({
      imports: [ProgramacionModalComponent],
      providers: [
        { provide: MantenimientoService, useValue: mantenimientoServiceMock },
        { provide: TechnicianService, useValue: techServiceMock },
        { provide: ClientService, useValue: clientServiceMock },
        { provide: ElevatorService, useValue: elevatorServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgramacionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('inicializa formData con valores por defecto', () => {
    expect(component.formData.hora_inicio).toBe('09:00');
    expect(component.formData.hora_fin).toBe('10:00');
    expect(component.formData.tipo_trabajo).toBe('mantenimiento');
    expect(component.formData.trabajador_ids).toEqual([]);
  });

  it('carga técnicos al iniciar', () => {
    expect(techServiceMock.getTechnicians).toHaveBeenCalled();
  });

  it('onClose emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push());
    component.close.emit();
    expect(emitted.length).toBe(1);
  });

  it('onSaved emite saved', () => {
    const emitted: void[] = [];
    component.saved.subscribe(() => emitted.push());
    component.saved.emit();
    expect(emitted.length).toBe(1);
  });

  it('tipoTrabajoOptions tiene opciones válidas', () => {
    expect(component.tipoTrabajoOptions.length).toBeGreaterThan(0);
    const mantenimiento = component.tipoTrabajoOptions.find(o => o.value === 'mantenimiento');
    expect(mantenimiento).toBeDefined();
  });
});
