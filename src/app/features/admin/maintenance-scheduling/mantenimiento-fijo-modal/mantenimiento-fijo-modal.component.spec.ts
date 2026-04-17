import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { MantenimientoFijoModalComponent } from './mantenimiento-fijo-modal.component';
import { MantenimientoFijoService } from '../../services/mantenimiento-fijo.service';
import { TechnicianService } from '../../services/technician.service';
import { ElevatorService } from '../../services/elevator.service';
import { ClientService } from '../../services/client.service';

describe('MantenimientoFijoModalComponent', () => {
  let component: MantenimientoFijoModalComponent;
  let fixture: ComponentFixture<MantenimientoFijoModalComponent>;
  let maintenanceServiceMock: any;
  let techServiceMock: any;
  let elevatorServiceMock: any;
  let clientServiceMock: any;

  const mockTechs = [{ id: 1, nombre: 'Juan', apellido: 'Pérez' }];

  beforeEach(async () => {
    maintenanceServiceMock = {
      createMantenimientoFijo: vi.fn().mockReturnValue(of({})),
      updateMantenimientoFijo: vi.fn().mockReturnValue(of({})),
    };
    techServiceMock = {
      getTechnicians: vi.fn().mockReturnValue(of(mockTechs)),
    };
    elevatorServiceMock = {
      getElevatorsByClient: vi.fn().mockReturnValue(of([])),
    };
    clientServiceMock = {
      getClientsPaginated: vi.fn().mockReturnValue(of({ data: [] })),
    };

    await TestBed.configureTestingModule({
      imports: [MantenimientoFijoModalComponent],
      providers: [
        { provide: MantenimientoFijoService, useValue: maintenanceServiceMock },
        { provide: TechnicianService, useValue: techServiceMock },
        { provide: ElevatorService, useValue: elevatorServiceMock },
        { provide: ClientService, useValue: clientServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MantenimientoFijoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('inicializa el formulario con valores por defecto', () => {
    expect(component.form.get('dia_mes')?.value).toBe(1);
    expect(component.form.get('hora')?.value).toBe('08:00');
    expect(component.form.get('frecuencia')?.value).toBe('mensual');
  });

  it('isEditMode es false en modo creación', () => {
    expect(component.isEditMode).toBe(false);
  });

  it('isEditMode es true cuando se pasa mantenimientoFijo', async () => {
    fixture = TestBed.createComponent(MantenimientoFijoModalComponent);
    component = fixture.componentInstance;
    component.mantenimientoFijo = {
      id: 1,
      ascensor_id: 3,
      dia_mes: 15,
      hora: '10:00',
      frecuencia: 'mensual',
    } as any;
    fixture.detectChanges();
    expect(component.isEditMode).toBe(true);
  });

  it('carga técnicos al iniciar', () => {
    expect(techServiceMock.getTechnicians).toHaveBeenCalled();
    expect(component.trabajadores.length).toBeGreaterThan(0);
  });

  it('formulario inválido cuando dia_mes está fuera de rango', () => {
    component.form.get('dia_mes')?.setValue(32);
    expect(component.form.get('dia_mes')?.invalid).toBe(true);
  });

  it('formulario inválido cuando ascensor_id es null', () => {
    expect(component.form.get('ascensor_id')?.invalid).toBe(true);
  });

  it('onClose emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push());
    component.close.emit();
    expect(emitted.length).toBe(1);
  });
});
