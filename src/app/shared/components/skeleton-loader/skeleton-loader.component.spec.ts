import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

describe('SkeletonLoaderComponent', () => {
  let component: SkeletonLoaderComponent;
  let fixture: ComponentFixture<SkeletonLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonLoaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default count 3', () => {
    expect(component.count).toBe(3);
  });

  it('should have default itemClass "skeleton-card"', () => {
    expect(component.itemClass).toBe('skeleton-card');
  });

  it('should have default containerClass "skeleton-grid"', () => {
    expect(component.containerClass).toBe('skeleton-grid');
  });

  it('should return countArray with length equal to count (default 3)', () => {
    expect(component.countArray).toHaveLength(3);
  });

  it('should return empty countArray when count is 0', () => {
    component.count = 0;
    expect(component.countArray).toHaveLength(0);
  });

  it('should return countArray with length 1 when count is 1', () => {
    component.count = 1;
    expect(component.countArray).toHaveLength(1);
  });

  it('should return countArray with length 5 when count is 5', () => {
    component.count = 5;
    expect(component.countArray).toHaveLength(5);
  });

  it('countArray should return Array filled with 0', () => {
    component.count = 3;
    const result = component.countArray;
    expect(result).toEqual([0, 0, 0]);
  });
});
