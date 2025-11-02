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
  isLoadingAchievements = false;

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
      id: storedUser?._id || '',
      fullName: storedUser?.fullname || 'مستخدم',
      role: (storedUser?.role as 'admin' | 'user') || 'user',
      username: storedUser?.username || '',
    };
  }

  loadUserData(): void {
    this.isLoading = true;

    this.activityService.getAll().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.userActivities = response.activities;

          this.userActivities.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });

          this.calculateStats(this.userActivities);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading activities:', error);
        Swal.fire('خطأ', 'فشل تحميل الأنشطة', 'error');
      },
    });

    this.loadRecentAchievements();
  }

  calculateStats(activities: Activity[]): void {
    this.userStats = {
      totalActivities: activities.length,
      pendingActivities: activities.filter((a) => a.status === 'قيد المراجعة')
        .length,
      approvedActivities: activities.filter((a) => a.status === 'معتمد').length,
      rejectedActivities: activities.filter((a) => a.status === 'مرفوض').length,
      draftActivities: activities.filter((a) => a.SaveStatus === 'مسودة')
        .length,
    };
  }

  loadRecentAchievements(): void {
    this.isLoadingAchievements = true;

    this.activityService.getRecentAchievements().subscribe({
      next: (response: any) => {
        this.isLoadingAchievements = false;

        console.log('Raw achievements response:', response);

        let achievements: RecentAchievement[] = [];

        if (response && Array.isArray(response)) {
          achievements = response;
        } else if (
          response &&
          response.success &&
          Array.isArray(response.activities)
        ) {
          achievements = response.activities;
        } else if (response && response.activities) {
          achievements = response.activities;
        } else {
          achievements = [];
          console.warn('Unexpected response format:', response);
        }

        this.recentAchievements = achievements.slice(0, 5);

        console.log(
          'Processed achievements (5 items):',
          this.recentAchievements
        );
      },
      error: (error) => {
        this.isLoadingAchievements = false;
        console.error('Error loading recent achievements:', error);
        this.recentAchievements = [];
        Swal.fire('خطأ', 'فشل تحميل السجل الزمني', 'error');
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


  getAchievementStatusClass(achievement: RecentAchievement): string {
    const status = this.getAchievementStatus(achievement);
    switch (status) {
      case 'معتمد':
        return 'status-approved';
      case 'مرفوض':
        return 'status-rejected';
      case 'قيد المراجعة':
        return 'status-pending';
      case 'جديد':
        return 'status-new';
      default:
        return 'status-default';
    }
  }

  getAchievementIcon(achievement: RecentAchievement): string {
    const status = this.getAchievementStatus(achievement);
    switch (status) {
      case 'معتمد':
        return 'fas fa-check-circle';
      case 'مرفوض':
        return 'fas fa-times-circle';
      case 'قيد المراجعة':
        return 'fas fa-clock';
      case 'جديد':
        return 'fas fa-plus-circle';
      default:
        return 'fas fa-info-circle';
    }
  }

  getAchievementStatus(achievement: RecentAchievement): string {
    const message = achievement.message.toLowerCase();

    if (message.includes('معتمد')) return 'معتمد';
    if (message.includes('مرفوض')) return 'مرفوض';
    if (message.includes('مراجعة')) return 'قيد المراجعة';
    if (message.includes('إضافة')) return 'جديد';

    if (achievement.status) {
      return achievement.status;
    }

    return 'غير محدد';
  }

  getAchievementType(achievement: RecentAchievement): string {
    const message = achievement.message.toLowerCase();
    if (message.includes('إضافة')) return 'إضافة إنجاز';
    if (message.includes('تحديث')) return 'تحديث إنجاز';
    if (message.includes('حذف')) return 'حذف إنجاز';
    return 'نشاط';
  }

  getAchievementTypeClass(achievement: RecentAchievement): string {
    const type = this.getAchievementType(achievement);
    switch (type) {
      case 'إضافة إنجاز':
        return 'type-new';
      case 'تحديث إنجاز':
        return 'type-update';
      case 'حذف إنجاز':
        return 'type-delete';
      default:
        return 'type-default';
    }
  }


  getAchievementUser(message: string): string {
    if (!message) return 'مستخدم غير معروف';

    const userMatch = message.match(/بواسطة:\s*([^\n]+)/);
    return userMatch ? userMatch[1].trim() : 'مستخدم غير معروف';
  }

  getAchievementAction(message: string): string {
    if (!message) return '';

    if (message.includes('تمت إضافة إنجاز جديد')) return 'أضاف إنجاز جديد';
    if (message.includes('تم تحديث إنجاز')) return 'حدث الإنجاز';
    if (message.includes('تم حذف إنجاز')) return 'حذف الإنجاز';
    return 'قام بإجراء';
  }

  getActivityTitle(message: string): string {
    if (!message) return '';

    const titleMatch = message.match(/عنوان:\s*"([^"]+)"/);
    return titleMatch ? titleMatch[1].trim() : '';
  }

  getActivityStandard(message: string): string {
    if (!message) return '';

    const standardMatch = message.match(/ضمن المعيار\s*"([^"]+)"/);
    return standardMatch ? standardMatch[1].trim() : '';
  }

  getActivityIndicator(message: string): string {
    if (!message) return '';

    const indicatorMatch = message.match(/-\s*"([^"]+)"\s*[\n\r]/);
    return indicatorMatch ? indicatorMatch[1].trim() : '';
  }


  formatAchievementDate(timeString: string): string {
    if (!timeString) return 'غير محدد';

    try {
      const dateMatch = timeString.match(
        /(\d{1,2})\u202F\/\u202F(\d{1,2})\u202F\/\u202F(\d{4})/
      );
      if (dateMatch) {
        const day = dateMatch[1];
        const month = dateMatch[2];
        const year = dateMatch[3];
        return `${year}/${month}/${day}`;
      }

      return timeString.split('،')[0] || timeString;
    } catch {
      return timeString;
    }
  }

  getAchievementTime(timeString: string): string {
    if (!timeString) return '';

    try {
      const timeMatch = timeString.match(/(\d{1,2}:\d{1,2}\s*[صمس])/);
      return timeMatch ? timeMatch[1] : '';
    } catch {
      return '';
    }
  }

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

  getStatValue(stat: keyof UserStats): number {
    return this.userStats[stat] || 0;
  }
}
