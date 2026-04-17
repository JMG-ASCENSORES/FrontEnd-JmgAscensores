import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { MaintenanceChecklistComponent } from './maintenance-checklist.component';

describe('MaintenanceChecklistComponent', () => {
  let component: MaintenanceChecklistComponent;
  let fixture: ComponentFixture<MaintenanceChecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceChecklistComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MaintenanceChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('tiene loading=false por defecto', () => {
    expect(component.loading).toBe(false);
  });

  it('items vacíos por defecto producen groupedChecklist vacío', () => {
    component.items = [];
    expect(component.groupedChecklist()).toEqual([]);
  });

  describe('groupedChecklist', () => {
    it('agrupa items por categoria', () => {
      component.items = [
        { categoria: 'MOTOR', realizado: false },
        { categoria: 'MOTOR', realizado: true },
        { categoria: 'FRENOS', realizado: false },
      ];
      const groups = component.groupedChecklist();
      expect(groups.length).toBe(2);
      expect(groups[0].categoria).toBe('MOTOR');
      expect(groups[0].tasks.length).toBe(2);
      expect(groups[1].categoria).toBe('FRENOS');
      expect(groups[1].tasks.length).toBe(1);
    });

    it('usa TareaMaestra.categoria si no hay categoria directa', () => {
      component.items = [
        { TareaMaestra: { categoria: 'LUBRICACION' }, realizado: false },
      ];
      const groups = component.groupedChecklist();
      expect(groups[0].categoria).toBe('LUBRICACION');
    });

    it('usa "VARIOS" como fallback cuando no hay categoria', () => {
      component.items = [{ realizado: false }];
      const groups = component.groupedChecklist();
      expect(groups[0].categoria).toBe('VARIOS');
    });
  });

  describe('isCategoryComplete()', () => {
    it('retorna false si no hay tasks', () => {
      expect(component.isCategoryComplete({ categoria: 'X', tasks: [] })).toBe(false);
    });

    it('retorna true si todos los tasks tienen realizado=true', () => {
      const group = { categoria: 'X', tasks: [{ realizado: true }, { realizado: true }] };
      expect(component.isCategoryComplete(group)).toBe(true);
    });

    it('retorna false si algún task tiene realizado=false', () => {
      const group = { categoria: 'X', tasks: [{ realizado: true }, { realizado: false }] };
      expect(component.isCategoryComplete(group)).toBe(false);
    });
  });

  describe('toggleTask()', () => {
    it('emite taskToggle con el task', () => {
      const emitted: any[] = [];
      component.taskToggle.subscribe(t => emitted.push(t));
      const task = { realizado: false };
      component.toggleTask(task);
      expect(emitted).toEqual([task]);
    });
  });

  describe('toggleCategory()', () => {
    it('emite categoryToggle con group y checked', () => {
      const emitted: any[] = [];
      component.categoryToggle.subscribe(e => emitted.push(e));
      const group = { categoria: 'X', tasks: [] };
      const event = { target: { checked: true } } as any;
      component.toggleCategory(group, event);
      expect(emitted[0]).toEqual({ group, checked: true });
    });
  });

  describe('trackByGroup()', () => {
    it('retorna la categoria del grupo', () => {
      expect(component.trackByGroup(0, { categoria: 'MOTOR', tasks: [] })).toBe('MOTOR');
    });
  });
});
