import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TechnicianDeleteComponent } from './technician-delete.component';
import { TechnicianService } from '../../services/technician.service';

describe('TechnicianDeleteComponent', () => {
  let component: TechnicianDeleteComponent;
  let fixture: ComponentFixture<TechnicianDeleteComponent>;
  let techServiceMock: any;

  beforeEach(async () => {
    techServiceMock = {
      deleteTechnician: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [TechnicianDeleteComponent],
      providers: [{ provide: TechnicianService, useValue: techServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TechnicianDeleteComponent);
    component = fixture.componentInstance;
    component.technician = { id: 3, nombre: 'Luis', apellido: 'Díaz' } as any;
    fixture.detectChanges();
  });

  it('onDelete llama deleteTechnician con el id correcto y emite technicianDeleted', () => {
    const emitted: void[] = [];
    component.technicianDeleted.subscribe(() => emitted.push(undefined));
    component.onDelete();
    expect(techServiceMock.deleteTechnician).toHaveBeenCalledWith(3);
    expect(emitted.length).toBe(1);
  });

  it('onDelete sets isDeleting=false al completar', () => {
    component.onDelete();
    expect(component.isDeleting()).toBe(false);
  });

  it('onDelete error sets errorMessage', () => {
    techServiceMock.deleteTechnician.mockReturnValue(throwError(() => new Error('fail')));
    component.onDelete();
    expect(component.errorMessage()).toContain('Error al eliminar');
    expect(component.isDeleting()).toBe(false);
  });

  it('onCancel emite close', () => {
    const emitted: void[] = [];
    component.close.subscribe(() => emitted.push(undefined));
    component.onCancel();
    expect(emitted.length).toBe(1);
  });
});
