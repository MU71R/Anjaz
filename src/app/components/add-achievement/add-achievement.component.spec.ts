import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAchievementComponent } from './add-achievement.component';

describe('AddAchievementComponent', () => {
  let component: AddAchievementComponent;
  let fixture: ComponentFixture<AddAchievementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddAchievementComponent]
    });
    fixture = TestBed.createComponent(AddAchievementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
