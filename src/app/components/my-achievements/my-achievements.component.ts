import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../../service/achievements-service.service';
import { Activity } from 'src/app/model/achievement';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-achievements',
  templateUrl: './my-achievements.component.html',
  styleUrls: ['./my-achievements.component.css'],
})
export class MyAchievementsComponent implements OnInit {
  searchTerm = '';
  statusFilter = 'all';
  achievements: Activity[] = [];
  selectedAchievement: Activity | null = null;
  rejectionReason = '';

  showDetailsModal = false;
  showRejectModal = false;

  constructor(private activityService: ActivityService) {}

  ngOnInit(): void {
    this.loadActivities();
  }

  // تحميل الإنجازات
  loadActivities(): void {
    this.activityService.getAll().subscribe({
      next: (res) => {
        if (res.success) this.achievements = res.activities;
      },
      error: () => {
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل الإنجازات', 'error');
      },
    });
  }

  // فلترة البحث
  filteredAchievements(): Activity[] {
    let list = [...this.achievements];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      list = list.filter(
        (a) =>
          a.activityTitle.toLowerCase().includes(term) ||
          a.activityDescription.toLowerCase().includes(term) ||
          (a.name?.toLowerCase().includes(term) ?? false)
      );
    }

    if (this.statusFilter !== 'all') {
      list = list.filter((a) => a.status === this.statusFilter);
    }

    return list;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
  }

  // عرض التفاصيل
  openDetailsModal(activity: Activity): void {
    this.selectedAchievement = activity;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedAchievement = null;
  }

  // رفض الإنجاز
  openRejectModal(activity: Activity): void {
    this.selectedAchievement = activity;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
  }

  submitRejection(): void {
    const achievement = this.selectedAchievement;
    if (!achievement || !achievement._id) return;

    this.activityService.updateStatus(achievement._id!, 'مرفوض').subscribe({
      next: (res) => {
        if (res.success) {
          this.updateLocalStatus(achievement._id!, 'مرفوض');
          this.showRejectModal = false;
          this.showDetailsModal = false;
          Swal.fire('تم الرفض', 'تم رفض الإنجاز بنجاح', 'success');
        }
      },
      error: () => Swal.fire('خطأ', 'تعذر رفض الإنجاز', 'error'),
    });
  }

  // اعتماد / حذف / إعادة تعيين
  handleAction(action: string, id?: string): void {
    if (!id) return;
    if (action === 'approve') {
      this.updateActivityStatus(id, 'معتمد');
    } else if (action === 'delete') {
      this.deleteActivity(id);
    } else if (action === 'reassign') {
      this.updateActivityStatus(id, 'قيد المراجعة');
    }
  }

  // تحديث الحالة
  updateActivityStatus(
    id: string,
    status: 'معتمد' | 'قيد المراجعة' | 'مرفوض'
  ): void {
    this.activityService.updateStatus(id, status).subscribe({
      next: (res) => {
        if (res.success) {
          this.updateLocalStatus(id, status);
          this.showDetailsModal = false;
          Swal.fire('تم', `تم تحديث الحالة إلى ${status}`, 'success');
        }
      },
      error: () => Swal.fire('خطأ', 'تعذر تحديث الحالة', 'error'),
    });
  }

  // حذف الإنجاز
  deleteActivity(id: string): void {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف هذا الإنجاز نهائيًا',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، حذف',
      cancelButtonText: 'إلغاء',
    }).then((result) => {
      if (result.isConfirmed) {
        this.activityService.delete(id).subscribe({
          next: (res) => {
            if (res.success) {
              this.achievements = this.achievements.filter((a) => a._id !== id);
              Swal.fire('تم الحذف', 'تم حذف الإنجاز بنجاح', 'success');
            }
          },
          error: () => Swal.fire('خطأ', 'تعذر حذف الإنجاز', 'error'),
        });
      }
    });
  }

  // تحديث الحالة محلياً
  private updateLocalStatus(id: string, status: string): void {
    this.achievements = this.achievements.map((a) =>
      a._id === id ? { ...a, status } : a
    );
  }

  // عرض النص بطريقة موحدة (field ممكن يكون string أو object)
  getNameField(field: any): string {
    if (!field) return 'غير محدد';
    return typeof field === 'object' ? field.name || 'غير محدد' : field;
  }

  // ألوان الحالة
  getStatusClass(status: string): string {
    switch (status) {
      case 'معتمد':
        return 'bg-success text-white';
      case 'قيد المراجعة':
        return 'bg-warning text-dark';
      case 'مرفوض':
        return 'bg-danger text-white';
      default:
        return '';
    }
  }

}
