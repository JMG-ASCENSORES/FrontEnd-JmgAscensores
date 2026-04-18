import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ElevatorEditComponent } from './elevator-edit.component';
import { ElevatorService } from '../../services/elevator.service';
import { ClientService } from '../../services/client.service';

describe('ElevatorEditComponent', () => {
  let component: ElevatorEditComponent;
  let fixture: ComponentFixture<ElevatorEditComponent>;
  let elevatorServiceMock: any;
  let clientServiceMock: any;

  const mockElevator = {
    ascensor_id: 5,
    tipo_equipo: 'Ascensor',
    marca: 'Otis',
    modelo: 'Gen2',
    numero_serie: 'SN-001',
    estado: 'Operativo',
  } as any;

  beforeEach(async () => {
    elevatorServiceMock = {
      updateElevator: vi.fn().mockReturnValue(of({})),
    };
    clientServiceMock = {
      getClients: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [ElevatorEditComponent],
      providers: [
        { provide: ElevatorService, useValue: elevatorServiceMock },
        { provide: ClientService, useValue: clientServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ElevatorEditComponent);
    component = fixture.componentInstance;
    component.elevator = mockElevator;
    fixture.detectChanges();
  });

  it('inicializa formData con los datos del elevador', () => {
    expect(component.formData.marca).toBe('Otis');
    expect(component.formData.numero_serie).toBe('SN-001');
  });

  it('onSubmit con numero_serie inválido sets error', () => {
    component.formData.numero_serie = '';
    component.onSubmit();
    expect(component.error()).toContain('número de serie');
    expect(elevatorServiceMock.updateElevator).not.toHaveBeenCalled();
  });

  it('onSubmit exitoso emite elevatorUpdated y close', () => {
    const updated: void[] = [];
    const closed: void[] = [];
    component.elevatorUpdated.subscribe(() => updated.push(undefined));
    component.close.subscribe(() => closed.push(undefined));

    component.onSubmit();

    expect(elevatorServiceMock.updateElevator).toHaveBeenCalledWith(5, expect.any(Object));
    expect(updated.length).toBe(1);
    expect(closed.length).toBe(1);
  });

  it('onSubmit error sets error signal', () => {
    elevatorServiceMock.updateElevator.mockReturnValue(throwError(() => ({ message: 'Error actualizar' })));
    component.onSubmit();
    expect(component.error()).toBe('Error actualizar');
  });
});
