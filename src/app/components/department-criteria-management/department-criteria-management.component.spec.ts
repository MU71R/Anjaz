import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentCriteriaManagementComponent } from './department-criteria-management.component';

describe('DepartmentCriteriaManagementComponent', () => {
  let component: DepartmentCriteriaManagementComponent;
  let fixture: ComponentFixture<DepartmentCriteriaManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DepartmentCriteriaManagementComponent]
    });
    fixture = TestBed.createComponent(DepartmentCriteriaManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
