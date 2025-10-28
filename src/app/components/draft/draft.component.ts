import { Component, OnInit } from '@angular/core';
import { ActivityService } from 'src/app/service/achievements-service.service';
import { Activity } from 'src/app/model/achievement';
import { Router } from '@angular/router';

@Component({
  selector: 'app-drafts',
  templateUrl: './draft.component.html',
  styleUrls: ['./draft.component.css'],
})
export class DraftsComponent implements OnInit {
  draftActivities: Activity[] = [];
  loading = true;

  constructor(
    private activityService: ActivityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkAuth();
    this.loadDrafts();
  }

  // ✅ فحص المصادقة أولاً
  checkAuth(): void {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    console.log('Current token:', token);

    if (!token) {
      alert('لم يتم العثور على توكن المصادقة. يرجى تسجيل الدخول.');
      this.router.navigate(['/login']);
      return;
    }
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
    this.loading = true;

    // ✅ فحص التوكن قبل الطلب
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      alert('يرجى تسجيل الدخول أولاً');
      this.router.navigate(['/login']);
      return;
    }

    this.activityService.getDrafts().subscribe({
      next: (response) => {
        console.log('Drafts response:', response);

        if (response.success) {
          this.draftActivities = response.data || [];
        } else {
          console.error('Failed to load drafts:', response);
          // ✅ إصلاح: استخدام response.message فقط إذا كان موجوداً
          const errorMessage = (response as any).message || 'Unknown error';
          alert('فشل في تحميل المسودات: ' + errorMessage);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading drafts:', err);

        if (err.status === 401) {
          alert('انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.');
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          this.router.navigate(['/login']);
        } else {
          alert('حدث خطأ في تحميل المسودات: ' + err.message);
        }

        this.loading = false;
      },
    });
  }

  editDraft(id: string): void {
    console.log('Editing draft with ID:', id);

    if (!id) {
      console.error('No ID provided');
      return;
    }

    // ✅ فحص التوكن قبل الانتقال
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      alert('يرجى تسجيل الدخول أولاً');
      this.router.navigate(['/login']);
      return;
    }

    this.router
      .navigate(['/add-achievement', id])
      .then((success) => {
        if (success) {
          console.log('Navigated to edit page successfully');
        } else {
          console.error('Failed to navigate to edit page');
        }
      })
      .catch((err) => {
        console.error('Navigation error:', err);
      });
  }

  deleteDraft(id: string): void {
    if (confirm('هل أنت متأكد من حذف المسودة؟')) {
      this.activityService.delete(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadDrafts();
            alert('تم حذف المسودة بنجاح');
          } else {
            // ✅ إصلاح: استخدام response.message فقط إذا كان موجوداً
            const errorMessage = (response as any).message || 'Unknown error';
            alert('فشل في حذف المسودة: ' + errorMessage);
          }
        },
        error: (err) => {
          console.error('Error deleting draft:', err);
          alert('فشل في حذف المسودة: ' + err.message);
        },
      });
    }
  }

  // ✅ دالة لفحص حالة المصادقة
  debugAuth(): void {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    console.log('=== DEBUG AUTH ===');
    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length);
    console.log('User ID:', userId);
    console.log('Token value (first 20 chars):', token?.substring(0, 20));
    console.log('==================');

    alert(
      `التوكن: ${!!token ? 'موجود (' + token.length + ' حرف)' : 'غير موجود'}`
    );
  }
}

