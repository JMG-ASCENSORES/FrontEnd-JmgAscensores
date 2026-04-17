import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { FilterContainerComponent } from './filter-container.component';

describe('FilterContainerComponent', () => {
  let component: FilterContainerComponent;
  let fixture: ComponentFixture<FilterContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterContainerComponent);
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
