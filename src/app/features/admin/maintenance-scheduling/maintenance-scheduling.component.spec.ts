import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MaintenanceSchedulingComponent } from './maintenance-scheduling.component';
import { MantenimientoService } from '../services/mantenimiento.service';
import { MantenimientoFijoService } from '../services/mantenimiento-fijo.service';

vi.mock('@fullcalendar/angular', () => ({
  FullCalendarModule: { ngModule: class {} },
  FullCalendarComponent: class {
    getApi() { return { today: vi.fn(), addEventSource: vi.fn() }; }
  },
}));

describe('MaintenanceSchedulingComponent', () => {
  let component: MaintenanceSchedulingComponent;
  let fixture: ComponentFixture<MaintenanceSchedulingComponent>;
  let mantenimientoServiceMock: any;
  let mantenimientoFijoServiceMock: any;

  const mockMantenimientos = [
    { id: 1, titulo: 'Manten. 1', start: '2024-01-15T09:00:00', end: '2024-01-15T10:00:00', color: '#22c55e' },
    { id: 2, titulo: 'Manten. 2', start: '2024-01-15T11:00:00', end: '2024-01-15T12:00:00', color: '#3b82f6' },
  ];

  beforeEach(async () => {
    mantenimientoServiceMock = {
      listar: vi.fn().mockReturnValue(of(mockMantenimientos)),
      eliminar: vi.fn().mockReturnValue(of({})),
      notificarTecnico: vi.fn().mockReturnValue(of({})),
    };
    mantenimientoFijoServiceMock = {
      listar: vi.fn().mockReturnValue(of([])),
      eliminar: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [MaintenanceSchedulingComponent],
      providers: [
        { provide: MantenimientoService, useValue: mantenimientoServiceMock },
        { provide: MantenimientoFijoService, useValue: mantenimientoFijoServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: vi.fn().mockReturnValue(null) } } }
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MaintenanceSchedulingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('inicializa showModal en false', () => {
    expect(component.showModal).toBe(false);
  });

  it('inicializa showFixedModal en false', () => {
    expect(component.showFixedModal).toBe(false);
  });

  it('loadMantenimientos sets errorMessage al fallar', () => {
    mantenimientoServiceMock.listar.mockReturnValue(throwError(() => new Error('fail')));
    component.loadMantenimientos();
    expect(component.errorMessage).toBeTruthy();
    expect(component.isLoading).toBe(false);
  });

  it('selectedFilterDate tiene un valor inicial de tipo fecha', () => {
    expect(component.selectedFilterDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('toast signal inicia en null', () => {
    expect(component.toast()).toBeNull();
  });
});
