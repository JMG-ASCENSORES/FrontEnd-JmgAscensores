import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProgrammingComponent } from './programming.component';
import { TechnicianService } from '../services/technician.service';
import { MantenimientoService } from '../services/mantenimiento.service';

const mockTechnicians = [
  { id: 1, nombre: 'Carlos', apellido: 'Lopez', especialidad: 'Supervisor Técnico', dni: '12345678' },
  { id: 2, nombre: 'Ana', apellido: 'Garcia', especialidad: 'Técnico de Mantenimiento', dni: '87654321' }
];

const mockMantenimientos = [
  {
    id: 1,
    title: 'Mantenimiento A',
    start: '2026-04-16T09:00:00',
    end: '2026-04-16T10:00:00',
    extendedProps: { tipo_trabajo: 'mantenimiento', estado: 'pendiente', cliente: { nombre_comercial: 'Edificio A', direccion: 'Av. Test 123' } }
  }
];

describe('ProgrammingComponent', () => {
  let component: ProgrammingComponent;
  let fixture: ComponentFixture<ProgrammingComponent>;
  let techServiceMock: any;
  let mantenimientoServiceMock: any;

  beforeEach(async () => {
    techServiceMock = {
      getTechnicians: vi.fn().mockReturnValue(of(mockTechnicians))
    };

    mantenimientoServiceMock = {
      listar: vi.fn().mockReturnValue(of(mockMantenimientos))
    };

    await TestBed.configureTestingModule({
      imports: [ProgrammingComponent, RouterModule.forRoot([])],
      providers: [
        { provide: TechnicianService, useValue: techServiceMock },
        { provide: MantenimientoService, useValue: mantenimientoServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProgrammingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should call loadWorkers and loadSchedules on init', () => {
    expect(techServiceMock.getTechnicians).toHaveBeenCalled();
    expect(mantenimientoServiceMock.listar).toHaveBeenCalled();
  });

  it('loadWorkers() should populate workers array sorted by specialty', () => {
    expect(component.workers.length).toBe(2);
    expect(component.workers[0].name).toBe('Carlos Lopez');
  });

  it('loadWorkers() should set isLoading to false on success', () => {
    expect(component.isLoading).toBe(false);
  });

  it('loadWorkers() should set isLoading to false on error', async () => {
    techServiceMock.getTechnicians.mockReturnValue(throwError(() => new Error('error')));
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [ProgrammingComponent, RouterModule.forRoot([])],
      providers: [
        { provide: TechnicianService, useValue: techServiceMock },
        { provide: MantenimientoService, useValue: mantenimientoServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    const f2 = TestBed.createComponent(ProgrammingComponent);
    const c2 = f2.componentInstance;
    f2.detectChanges();
    expect(c2.isLoading).toBe(false);
  });

  it('getRoleColor() should return correct color for known specialty', () => {
    expect(component.getRoleColor('Supervisor Técnico')).toBe('bg-purple-100 text-purple-600');
    expect(component.getRoleColor('Técnico de Mantenimiento')).toBe('bg-teal-100 text-teal-600');
  });

  it('getRoleColor() should return default color for unknown specialty', () => {
    expect(component.getRoleColor('Desconocido')).toBe('bg-slate-100 text-slate-600');
  });

  it('getRoleIcon() should return correct icon for known specialty', () => {
    expect(component.getRoleIcon('Supervisor Técnico')).toBe('user-cog');
  });

  it('formatType() should map tipo values correctly', () => {
    expect(component.formatType('mantenimiento')).toBe('Mantenimiento');
    expect(component.formatType('emergencia')).toBe('Emergencia');
    expect(component.formatType(undefined)).toBe('Desconocido');
  });

  it('selectSchedule() should set selectedSchedule', () => {
    const schedule: any = {
      id: 1,
      clientName: 'Test',
      type: 'Mantenimiento',
      technicianName: 'Carlos',
      time: '09:00',
      address: 'Av. Test',
      avatarColor: 'bg-blue-400',
      originalData: mockMantenimientos[0]
    };
    component.selectSchedule(schedule);
    expect(component.selectedSchedule).toEqual(schedule);
  });

  it('showToast() should set toast signal', () => {
    component.showToast('Test message', 'success', 'Éxito');
    expect(component.toast()).toEqual({ message: 'Test message', type: 'success', title: 'Éxito' });
  });

  it('isTechNotified() should return false for not-notified tech', () => {
    expect(component.isTechNotified(999)).toBe(false);
  });

  it('getWorkloadBadge() should return null for tech with no workload', () => {
    expect(component.getWorkloadBadge(999)).toBeNull();
  });
});
