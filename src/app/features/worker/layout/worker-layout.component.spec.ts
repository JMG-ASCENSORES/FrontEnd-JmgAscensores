import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture, NO_ERRORS_SCHEMA } from '@angular/core/testing';
import { WorkerLayoutComponent } from './worker-layout.component';
import { AuthService } from '../../../core/services/auth.service';

describe('WorkerLayoutComponent', () => {
  let component: WorkerLayoutComponent;
  let fixture: ComponentFixture<WorkerLayoutComponent>;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {};

    await TestBed.configureTestingModule({
      imports: [WorkerLayoutComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have authService injected', () => {
    expect((component as any).authService).toBeDefined();
  });

  it('should expose authService as protected property', () => {
    expect((component as any).authService).toBe(authServiceMock);
  });
});
