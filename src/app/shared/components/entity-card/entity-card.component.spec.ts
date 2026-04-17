import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { EntityCardComponent } from './entity-card.component';

describe('EntityCardComponent', () => {
  let component: EntityCardComponent;
  let fixture: ComponentFixture<EntityCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a defined instance', () => {
    expect(component).toBeDefined();
  });

  it('should render without errors', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
