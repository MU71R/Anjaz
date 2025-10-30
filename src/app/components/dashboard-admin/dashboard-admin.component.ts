import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../../service/achievements-service.service';
import { Activity } from 'src/app/model/achievement';
import { LoginService } from 'src/app/service/login.service';
import Swal from 'sweetalert2';

interface User {
  id: string;
  fullName: string;
  role: 'admin' | 'user';
  username?: string;
}

interface RecentAchievement {
  message: string;
  time: string;
  id: string;
  activityId?: string;
  status?: string;
}

interface UserStats {
  totalActivities: number;
  pendingActivities: number;
  approvedActivities: number;
  rejectedActivities: number;
  draftActivities: number;
}

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
})
export class DashboardAdminComponent implements OnInit {
  currentUser: User = {
    id: '',
    fullName: '',
    role: 'user',
    username: '',
  };

  userActivities: Activity[] = [];
  recentAchievements: RecentAchievement[] = [];
  userStats: UserStats = {
    totalActivities: 0,
    pendingActivities: 0,
    approvedActivities: 0,
    rejectedActivities: 0,
    draftActivities: 0,
  };

  isLoading = false;

  constructor(
    private activityService: ActivityService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUserData();
  }

  loadCurrentUser(): void {
    const storedUser = this.loginService.getCurrentUser();
    this.currentUser = {
      id: storedUser?._id || localStorage.getItem('userId') || '',
      fullName:
        storedUser?.fullname || localStorage.getItem('fullname') || 'مستخدم',
      role:
        (storedUser?.role as 'admin' | 'user') ||
        (localStorage.getItem('role') as 'admin' | 'user') ||
        'user',
      username: storedUser?.username || '',
    };
  }

  loadUserData(): void {
    this.isLoading = true;

    // تحميل الإحصائيات
    this.activityService.getUserStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.userStats = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading user stats:', error);
      },
    });

    // تحميل الأنشطة
    this.activityService.getUserActivities().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.userActivities = response.activities;
          // ✅ تصحيح: استخدام string بدلاً من Date مباشرة
          this.userActivities.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading user activities:', error);
        Swal.fire('خطأ', 'فشل تحميل الأنشطة', 'error');
      },
    });

    // تحميل الإنجازات الحديثة
    this.loadRecentAchievements();
  }

  loadRecentAchievements(): void {
    this.activityService.getRecentAchievements().subscribe({
      next: (achievements: RecentAchievement[]) => {
        this.recentAchievements = achievements
          .map((achievement) => {
            // تحسين تنسيق الرسالة والوقت
            let message = achievement.message || '';
            let time = achievement.time || '';

            // إذا كانت الرسالة تحتوي على توقيت، نعيد تنسيقه
            if (message.includes('<small>')) {
              const timeMatch = message.match(/<small>(.*?)<\/small>/);
              if (timeMatch) {
                time = timeMatch[1];
                message = message.replace(/<small>.*?<\/small>/, '');
              }
            }

            return {
              ...achievement,
              message: message.trim(),
              time: time,
            };
          })
          .slice(0, 10); // عرض آخر 10 إنجازات فقط
      },
      error: (error) => {
        console.error('Error loading recent achievements:', error);
      },
    });
  }

  getRoleDisplayName(): string {
    return this.currentUser.role === 'admin' ? 'مدير النظام' : 'مستخدم';
  }

  getRoleBadgeClass(): string {
    return this.currentUser.role === 'admin'
      ? 'badge bg-danger'
      : 'badge bg-primary';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'قيد المراجعة':
        return 'badge bg-warning';
      case 'معتمد':
        return 'badge bg-success';
      case 'مرفوض':
        return 'badge bg-danger';
      case 'مسودة':
        return 'badge bg-secondary';
      default:
        return 'badge bg-light text-dark';
    }
  }

  getAchievementStatusClass(achievement: RecentAchievement): string {
    const message = achievement.message.toLowerCase();
    if (message.includes('معتمد')) return 'achievement-approved';
    if (message.includes('مرفوض')) return 'achievement-rejected';
    if (message.includes('مراجعة')) return 'achievement-pending';
    return 'achievement-default';
  }

  getAchievementStatus(achievement: RecentAchievement): string {
    const message = achievement.message.toLowerCase();
    if (message.includes('معتمد')) return 'معتمد';
    if (message.includes('مرفوض')) return 'مرفوض';
    if (message.includes('مراجعة')) return 'قيد المراجعة';
    return '';
  }

  // ✅ تصحيح: التحقق من وجود التاريخ قبل التنسيق
  formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return 'غير محدد';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'غير محدد';

      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'غير محدد';
    }
  }

  // دالة مساعدة للحصول على قيمة الإحصائيات
  getStatValue(stat: keyof UserStats): number {
    return this.userStats[stat] || 0;
  }
}
