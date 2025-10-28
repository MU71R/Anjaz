import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../../service/achievements-service.service';
import { Activity } from 'src/app/model/achievement';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-archived-activities',
  templateUrl: './archives.component.html',
  styleUrls: ['./archives.component.css'],
})
export class ArchivedActivitiesComponent implements OnInit {
  archivedActivities: Activity[] = [];
  loading = true;
  errorMessage = '';

  constructor(private activityService: ActivityService) {}

  ngOnInit(): void {
    this.loadArchivedActivities();
  }

  loadArchivedActivities(): void {
    this.activityService.getArchivedActivities().subscribe({
      next: (res) => {
        this.archivedActivities = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'حدث خطأ أثناء تحميل الإنجازات المؤرشفة';
        console.error(err);
        Swal.fire('خطأ', this.errorMessage, 'error');
      },
    });
  }

  getCriteriaName(criteria: any): string {
    if (!criteria) return '-';
    if (typeof criteria === 'string') return criteria;
    return criteria.name || '-';
  }
}
