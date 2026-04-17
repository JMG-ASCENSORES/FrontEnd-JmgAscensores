import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ElevatorDeleteComponent } from './elevator-delete.component';
import { ElevatorService } from '../../services/elevator.service';

describe('ElevatorDeleteComponent', () => {
  let component: ElevatorDeleteComponent;
  let fixture: ComponentFixture<ElevatorDeleteComponent>;
  let elevatorServiceMock: any;

  beforeEach(async () => {
    elevatorServiceMock = {
      deleteElevator: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [ElevatorDeleteComponent],
      providers: [{ provide: ElevatorService, useValue: elevatorServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ElevatorDeleteComponent);
    component = fixture.componentInstance;
    component.elevator = { ascensor_id: 7, tipo_equipo: 'Ascensor', marca: 'Otis' } as any;
    fixture.detectChanges();
  });

  it('confirmDelete llama deleteElevator con id correcto y emite elevatorDeleted', () => {
    const emitted: void[] = [];
    component.elevatorDeleted.subscribe(() => emitted.push());
    component.confirmDelete();
    expect(elevatorServiceMock.deleteElevator).toHaveBeenCalledWith(7);
    expect(emitted.length).toBe(1);
  });

  it('confirmDelete sets isSubmitting=false al completar', () => {
    component.confirmDelete();
    expect(component.isSubmitting()).toBe(false);
  });

  it('confirmDelete error sets error signal', () => {
    elevatorServiceMock.deleteElevator.mockReturnValue(throwError(() => ({ message: 'Error borrar' })));
    component.confirmDelete();
    expect(component.error()).toBe('Error borrar');
    expect(component.isSubmitting()).toBe(false);
  });

  it('no llama deleteElevator si ya está submitting', () => {
    component.isSubmitting.set(true);
    component.confirmDelete();
    expect(elevatorServiceMock.deleteElevator).not.toHaveBeenCalled();
  });
});
