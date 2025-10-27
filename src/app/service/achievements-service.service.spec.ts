import { TestBed } from '@angular/core/testing';

import { AchievementsServiceService } from './achievements-service.service';

describe('AchievementsServiceService', () => {
  let service: AchievementsServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AchievementsServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
