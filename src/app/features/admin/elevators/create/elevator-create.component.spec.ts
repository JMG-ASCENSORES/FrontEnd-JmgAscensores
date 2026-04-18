import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ElevatorCreateComponent } from './elevator-create.component';
import { ElevatorService } from '../../services/elevator.service';
import { ClientService } from '../../services/client.service';

describe('ElevatorCreateComponent', () => {
  let component: ElevatorCreateComponent;
  let fixture: ComponentFixture<ElevatorCreateComponent>;
  let elevatorServiceMock: any;
  let clientServiceMock: any;

  beforeEach(async () => {
    elevatorServiceMock = {
      createElevator: vi.fn().mockReturnValue(of({})),
    };
    clientServiceMock = {
      getClients: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [ElevatorCreateComponent],
      providers: [
        { provide: ElevatorService, useValue: elevatorServiceMock },
        { provide: ClientService, useValue: clientServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ElevatorCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga clientes al iniciar', () => {
    expect(clientServiceMock.getClients).toHaveBeenCalled();
  });

  it('tiene valores por defecto correctos', () => {
    expect(component.formData.tipo_equipo).toBe('Ascensor');
    expect(component.formData.estado).toBe('Operativo');
    expect(component.formData.piso_cantidad).toBe(1);
  });

  it('onSubmit sin numero_serie sets error', () => {
    component.formData = { ...component.formData, numero_serie: '' };
    component.onSubmit();
    expect(component.error()).toContain('número de serie');
    expect(elevatorServiceMock.createElevator).not.toHaveBeenCalled();
  });

  it('onSubmit con capacidad_kg negativa sets error', () => {
    component.formData = { ...component.formData, numero_serie: 'SN001', capacidad_kg: -1 };
    component.onSubmit();
    expect(component.error()).toContain('KG');
  });

  it('onSubmit exitoso emite elevatorCreated y close', () => {
    const created: void[] = [];
    const closed: void[] = [];
    component.elevatorCreated.subscribe(() => created.push(undefined));
    component.close.subscribe(() => closed.push(undefined));

    component.formData = { ...component.formData, numero_serie: 'SN-001' };
    component.onSubmit();

    expect(elevatorServiceMock.createElevator).toHaveBeenCalled();
    expect(created.length).toBe(1);
    expect(closed.length).toBe(1);
  });

  it('onSubmit error sets error signal', () => {
    elevatorServiceMock.createElevator.mockReturnValue(throwError(() => ({ message: 'Error crear' })));
    component.formData = { ...component.formData, numero_serie: 'SN-001' };
    component.onSubmit();
    expect(component.error()).toBe('Error crear');
    expect(component.isSubmitting()).toBe(false);
  });
});
