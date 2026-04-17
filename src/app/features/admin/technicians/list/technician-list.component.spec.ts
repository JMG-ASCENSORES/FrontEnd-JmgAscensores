import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TechnicianListComponent } from './technician-list.component';
import { TechnicianService } from '../../services/technician.service';

describe('TechnicianListComponent', () => {
  let component: TechnicianListComponent;
  let fixture: ComponentFixture<TechnicianListComponent>;
  let techServiceMock: any;

  const mockTechnicians = [
    { id: 1, nombre: 'Juan', apellido: 'Pérez', dni: '12345678', especialidad: 'Técnico General', estado_activo: true },
    { id: 2, nombre: 'Ana', apellido: 'Gómez', dni: '87654321', especialidad: 'Técnico de Mantenimiento', estado_activo: true },
  ];

  beforeEach(async () => {
    techServiceMock = {
      getTechnicians: vi.fn().mockReturnValue(of(mockTechnicians)),
    };

    await TestBed.configureTestingModule({
      imports: [TechnicianListComponent],
      providers: [
        { provide: TechnicianService, useValue: techServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: vi.fn().mockReturnValue(null) } } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TechnicianListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga técnicos activos al iniciar', () => {
    expect(techServiceMock.getTechnicians).toHaveBeenCalledWith({ estado_activo: true });
    expect(component.technicians().length).toBe(2);
    expect(component.isLoading()).toBe(false);
  });

  it('sets error 403 con mensaje de acceso denegado', () => {
    techServiceMock.getTechnicians.mockReturnValue(throwError(() => ({ status: 403 })));
    component.loadTechnicians();
    expect(component.error()).toContain('Acceso Denegado');
  });

  it('sets error genérico para otros errores', () => {
    techServiceMock.getTechnicians.mockReturnValue(throwError(() => ({ status: 500 })));
    component.loadTechnicians();
    expect(component.error()).toContain('Error al cargar');
  });

  it('filteredTechnicians filtra por searchQuery', () => {
    component.technicians.set(mockTechnicians as any);
    component.searchQuery.set('juan');
    expect(component.filteredTechnicians().length).toBe(1);
    expect(component.filteredTechnicians()[0].nombre).toBe('Juan');
  });

  it('filteredTechnicians filtra por especialidad', () => {
    component.technicians.set(mockTechnicians as any);
    component.selectedSpecialty.set('Técnico de Mantenimiento');
    expect(component.filteredTechnicians().length).toBe(1);
    expect(component.filteredTechnicians()[0].nombre).toBe('Ana');
  });

  it('totalTechnicians retorna el total de técnicos', () => {
    expect(component.totalTechnicians()).toBe(2);
  });

  it('getInitials retorna iniciales en mayúscula', () => {
    expect(component.getInitials('Juan', 'Pérez')).toBe('JP');
  });

  it('getSpecialtyColor retorna clase para cada especialidad', () => {
    expect(component.getSpecialtyColor('Técnico General')).toContain('emerald');
    expect(component.getSpecialtyColor('Técnico de Mantenimiento')).toContain('blue');
    expect(component.getSpecialtyColor('Supervisor Técnico')).toContain('purple');
  });

  it('openCreateModal sets showCreateModal=true', () => {
    component.openCreateModal();
    expect(component.showCreateModal()).toBe(true);
  });

  it('openEditModal sets selectedTechnician y showEditModal=true', () => {
    const tech = mockTechnicians[0] as any;
    component.openEditModal(tech);
    expect(component.selectedTechnician()).toEqual(tech);
    expect(component.showEditModal()).toBe(true);
  });

  it('closeDeleteModal limpia technicianToDelete', () => {
    component.technicianToDelete.set(mockTechnicians[0] as any);
    component.closeDeleteModal();
    expect(component.technicianToDelete()).toBeNull();
  });
});
