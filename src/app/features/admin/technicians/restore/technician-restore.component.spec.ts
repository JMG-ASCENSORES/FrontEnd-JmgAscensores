import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TechnicianRestoreComponent } from './technician-restore.component';
import { TechnicianService } from '../../services/technician.service';

describe('TechnicianRestoreComponent', () => {
  let component: TechnicianRestoreComponent;
  let fixture: ComponentFixture<TechnicianRestoreComponent>;
  let techServiceMock: any;

  const mockInactive = [{ id: 5, nombre: 'Inactivo', apellido: 'Técnico', estado_activo: false }];

  beforeEach(async () => {
    techServiceMock = {
      getTechnicians: vi.fn().mockReturnValue(of(mockInactive)),
      updateTechnician: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [TechnicianRestoreComponent],
      providers: [{ provide: TechnicianService, useValue: techServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TechnicianRestoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga técnicos inactivos al iniciar', () => {
    expect(techServiceMock.getTechnicians).toHaveBeenCalledWith({ estado_activo: false });
    expect(component.inactiveTechnicians()).toEqual(mockInactive);
    expect(component.isLoading()).toBe(false);
  });

  it('sets error cuando loadInactiveTechnicians falla', () => {
    techServiceMock.getTechnicians.mockReturnValue(throwError(() => new Error('fail')));
    component.loadInactiveTechnicians();
    expect(component.error()).toBe('No se pudieron cargar los técnicos desactivados.');
  });

  it('initiateRestore sets confirmingId', () => {
    component.initiateRestore(5);
    expect(component.confirmingId()).toBe(5);
  });

  it('cancelRestore limpia confirmingId', () => {
    component.confirmingId.set(5);
    component.cancelRestore();
    expect(component.confirmingId()).toBeNull();
  });

  it('confirmRestore llama updateTechnician y emite technicianRestored', () => {
    const emitted: void[] = [];
    component.technicianRestored.subscribe(() => emitted.push());
    const tech = mockInactive[0] as any;
    component.confirmRestore(tech);
    expect(techServiceMock.updateTechnician).toHaveBeenCalledWith(5, { estado_activo: true });
    expect(emitted.length).toBe(1);
  });

  it('onClose emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push());
    component.onClose();
    expect(emitted.length).toBe(1);
  });
});
