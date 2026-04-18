import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { WorkerRoutesComponent } from './worker-routes.component';
import { AuthService } from '../../../core/services/auth.service';
import { MantenimientoService } from '../../admin/services/mantenimiento.service';
import { DomSanitizer } from '@angular/platform-browser';

const mockUser = { id: 1, tipo: 'trabajador', nombre: 'Test Worker' };
const mockRoutes = [
  {
    id: '1',
    title: 'Mantenimiento',
    start: '2024-01-15T09:00:00',
    extendedProps: { tipo_trabajo: 'mantenimiento', status: 'pendiente' }
  },
  {
    id: '2',
    title: 'Reparacion',
    start: '2024-01-15T14:00:00',
    extendedProps: { tipo_trabajo: 'reparacion', status: 'completado' }
  }
];

describe('WorkerRoutesComponent', () => {
  let component: WorkerRoutesComponent;
  let fixture: ComponentFixture<WorkerRoutesComponent>;
  let authServiceMock: any;
  let mantenimientoServiceMock: any;
  let domSanitizerMock: any;

  beforeEach(async () => {
    authServiceMock = {
      currentUser: vi.fn().mockReturnValue(mockUser)
    };

    mantenimientoServiceMock = {
      listar: vi.fn().mockReturnValue(of(mockRoutes))
    };

    domSanitizerMock = {
      bypassSecurityTrustResourceUrl: vi.fn(url => url)
    };

    await TestBed.configureTestingModule({
      imports: [WorkerRoutesComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: MantenimientoService, useValue: mantenimientoServiceMock },
        { provide: DomSanitizer, useValue: domSanitizerMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('generateDateSlider()', () => {
    it('should generate 8 dates (yesterday + today + 6 future days)', () => {
      component.generateDateSlider();
      expect(component.dates()).toHaveLength(8);
    });

    it('should select today as the default selected date (index 1)', () => {
      component.generateDateSlider();
      const dates = component.dates();
      // Today is at index 1 (after yesterday at index 0)
      expect(component.selectedDateStr()).toBe(dates[1].str);
    });

    it('should label index 0 as Ayer', () => {
      component.generateDateSlider();
      expect(component.dates()[0].label).toBe('Ayer');
    });

    it('should label index 1 as Hoy', () => {
      component.generateDateSlider();
      expect(component.dates()[1].label).toBe('Hoy');
    });

    it('should label index 2 as Mañana', () => {
      component.generateDateSlider();
      expect(component.dates()[2].label).toBe('Mañana');
    });
  });

  describe('selectDate()', () => {
    it('should change selectedDateStr to the provided date string', () => {
      const newDate = '2024-03-20';
      component.selectDate(newDate);
      expect(component.selectedDateStr()).toBe(newDate);
    });
  });

  describe('openRouteDetails()', () => {
    it('should set selectedRoute with the provided route', () => {
      const route = mockRoutes[0] as any;
      component.openRouteDetails(route);
      expect(component.selectedRoute()).toBe(route);
    });
  });

  describe('closeRouteDetails()', () => {
    it('should set selectedRoute to null', () => {
      component.selectedRoute.set(mockRoutes[0] as any);
      component.closeRouteDetails();
      expect(component.selectedRoute()).toBeNull();
    });
  });

  describe('getTypeLabel()', () => {
    it("should return 'Mantenimiento' for tipo 'mantenimiento'", () => {
      expect(component.getTypeLabel('mantenimiento')).toBe('Mantenimiento');
    });

    it("should return 'Reparación' for tipo 'reparacion'", () => {
      expect(component.getTypeLabel('reparacion')).toBe('Reparación');
    });

    it("should return 'Inspección' for tipo 'inspeccion'", () => {
      expect(component.getTypeLabel('inspeccion')).toBe('Inspección');
    });

    it("should return 'Emergencia' for tipo 'emergencia'", () => {
      expect(component.getTypeLabel('emergencia')).toBe('Emergencia');
    });

    it("should return 'Trabajo' if tipo is undefined", () => {
      expect(component.getTypeLabel(undefined)).toBe('Trabajo');
    });

    it('should return the original tipo if not in map', () => {
      expect(component.getTypeLabel('custom')).toBe('custom');
    });
  });

  describe('getTypeColor()', () => {
    it('should return blue classes for mantenimiento', () => {
      expect(component.getTypeColor('mantenimiento')).toBe('bg-blue-100 text-blue-700');
    });

    it('should return orange classes for reparacion', () => {
      expect(component.getTypeColor('reparacion')).toBe('bg-orange-100 text-orange-700');
    });

    it('should return green classes for inspeccion', () => {
      expect(component.getTypeColor('inspeccion')).toBe('bg-green-100 text-green-700');
    });

    it('should return red classes for emergencia', () => {
      expect(component.getTypeColor('emergencia')).toBe('bg-red-100 text-red-700');
    });

    it('should return slate classes for undefined tipo', () => {
      expect(component.getTypeColor(undefined)).toBe('bg-slate-100 text-slate-600');
    });
  });

  describe('getStatusIcon()', () => {
    it('should return clock icon for pendiente', () => {
      expect(component.getStatusIcon('pendiente')).toBe('bi-clock text-yellow-500');
    });

    it('should return play-circle icon for en_progreso', () => {
      expect(component.getStatusIcon('en_progreso')).toBe('bi-play-circle text-blue-500');
    });

    it('should return check-circle icon for completado', () => {
      expect(component.getStatusIcon('completado')).toBe('bi-check-circle-fill text-green-500');
    });

    it('should return x-circle icon for cancelado', () => {
      expect(component.getStatusIcon('cancelado')).toBe('bi-x-circle text-red-500');
    });

    it('should return clock icon for undefined status', () => {
      expect(component.getStatusIcon(undefined)).toBe('bi-clock text-yellow-500');
    });
  });

  describe('formatTime()', () => {
    it('should extract HH:mm from ISO string', () => {
      expect(component.formatTime('2024-01-15T09:30:00')).toBe('09:30');
    });

    it('should return empty string for empty input', () => {
      expect(component.formatTime('')).toBe('');
    });
  });

  describe('loadMyRoutes()', () => {
    it('should not do anything if user is null', () => {
      authServiceMock.currentUser.mockReturnValue(null);
      mantenimientoServiceMock.listar.mockClear();
      component.loadMyRoutes();
      expect(mantenimientoServiceMock.listar).not.toHaveBeenCalled();
    });

    it('should call mantenimientoService.listar when user exists', () => {
      component.loadMyRoutes();
      expect(mantenimientoServiceMock.listar).toHaveBeenCalled();
    });

    it('should set allRoutes on success', () => {
      component.loadMyRoutes();
      expect(component.allRoutes()).toHaveLength(2);
    });

    it('should set isLoading to false on success', () => {
      component.loadMyRoutes();
      expect(component.isLoading()).toBe(false);
    });

    it('should set error signal on failure', () => {
      mantenimientoServiceMock.listar.mockReturnValue(throwError(() => new Error('Error')));
      component.loadMyRoutes();
      expect(component.error()).toBe('No se pudieron cargar tus rutas. Intenta nuevamente.');
    });
  });
});
