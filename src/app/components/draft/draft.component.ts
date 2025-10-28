import { Component, OnInit } from '@angular/core';
import { ActivityService } from 'src/app/service/achievements-service.service';
import { Activity } from 'src/app/model/achievement';

@Component({
  selector: 'app-drafts',
  templateUrl: './draft.component.html',
  styleUrls: ['./draft.component.css'],
})
export class DraftsComponent implements OnInit {
  draftActivities: Activity[] = [];
  loading = true;

  constructor(private activityService: ActivityService) {}

  ngOnInit(): void {
    this.loadDrafts();
  }

  getMainCriteriaName(activity: Activity): string {
    return typeof activity.MainCriteria === 'object'
      ? activity.MainCriteria?.name || ''
      : activity.MainCriteria || '';
  }

  getSubCriteriaName(activity: Activity): string {
    return typeof activity.SubCriteria === 'object'
      ? activity.SubCriteria?.name || ''
      : activity.SubCriteria || '';
  }

  loadDrafts(): void {
    this.activityService.getDraftActivities().subscribe({
      next: (data) => {
        this.draftActivities = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ في جلب المسودات:', err);
        this.loading = false;
      },
    });
  }
}
