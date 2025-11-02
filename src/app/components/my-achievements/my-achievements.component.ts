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
  loading = true;

  showDetailsModal = false;
  showRejectModal = false;
  showImageModal = false;
  selectedImage = '';
  isAdmin = false;
  currentUser: any = null;

  constructor(private activityService: ActivityService) {}

  ngOnInit(): void {
    this.loadActivities();
    this.checkAdminRole();
  }

  checkAdminRole(): void {
    try {
      const token =
        localStorage.getItem('token') || localStorage.getItem('authToken');

      if (token) {
        const tokenPayload = this.decodeToken(token);
        if (tokenPayload) {
          this.currentUser = tokenPayload;
          this.isAdmin =
            tokenPayload.role === 'admin' || tokenPayload.isAdmin === true;
          return;
        }
      }

      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.currentUser = user;
        this.isAdmin = user.role === 'admin' || user.isAdmin === true;
        return;
      }

      this.isAdmin = false;
      console.warn('لم يتم العثور على بيانات المستخدم أو token');
    } catch (error) {
      console.error('خطأ في التحقق من صلاحية المستخدم:', error);
      this.isAdmin = false;
    }
  }

  private decodeToken(token: string): any {
    try {
      if (token.split('.').length === 3) {
        const payload = token.split('.')[1];
        const decodedPayload = atob(
          payload.replace(/-/g, '+').replace(/_/g, '/')
        );
        return JSON.parse(decodedPayload);
      }
      return null;
    } catch (error) {
      console.error('خطأ في فك تشفير الـ token:', error);
      return null;
    }
  }

  loadActivities(): void {
    this.loading = true;
    this.activityService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.achievements = res.activities || [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading activities:', err);
        this.loading = false;
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل الإنجازات', 'error');
      },
    });
  }

  getCleanDescription(description: string): string {
    return this.activityService.cleanDescriptionForDisplay(description);
  }

  getShortDescription(description: string, length: number = 50): string {
    const cleanDescription = this.getCleanDescription(
      description || 'لا يوجد وصف'
    );
    return cleanDescription.length > length
      ? cleanDescription.substring(0, length) + '...'
      : cleanDescription;
  }

  filteredAchievements(): Activity[] {
    let list = [...this.achievements];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      list = list.filter(
        (a) =>
          a.activityTitle?.toLowerCase().includes(term) ||
          this.getCleanDescription(a.activityDescription || '')
            .toLowerCase()
            .includes(term) ||
          a.name?.toLowerCase().includes(term) ||
          this.getUserName(a.user)?.toLowerCase().includes(term)
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

  openDetailsModal(activity: Activity): void {
    this.selectedAchievement = activity;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedAchievement = null;
  }

  handleAction(action: string, id?: string): void {
    if (!id) return;

    const actions = {
      approve: () => this.updateActivityStatus(id, 'معتمد'),
      reassign: () => this.updateActivityStatus(id, 'قيد المراجعة'),
      delete: () => this.deleteActivity(id),
    };

    const actionHandler = actions[action as keyof typeof actions];
    if (actionHandler) {
      actionHandler();
    }
  }

  updateActivityStatus(
    id: string,
    status: 'معتمد' | 'قيد المراجعة' | 'مرفوض'
  ): void {
    if (!this.isAdmin) {
      Swal.fire('خطأ', 'ليس لديك صلاحية لهذا الإجراء', 'error');
      return;
    }

    this.activityService.updateStatus(id, status).subscribe({
      next: (res) => {
        if (res.success) {
          this.updateLocalStatus(id, status);
          Swal.fire('تم', `تم تحديث الحالة إلى ${status}`, 'success');
        }
      },
      error: (err) => {
        console.error('Error updating status:', err);
        Swal.fire('خطأ', 'تعذر تحديث الحالة', 'error');
      },
    });
  }

  openRejectModal(activity: Activity): void {
    if (!this.isAdmin) {
      Swal.fire('خطأ', 'ليس لديك صلاحية لهذا الإجراء', 'error');
      return;
    }

    this.selectedAchievement = activity;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedAchievement = null;
  }

  submitRejection(): void {
    if (!this.isAdmin) {
      Swal.fire('خطأ', 'ليس لديك صلاحية لهذا الإجراء', 'error');
      return;
    }

    const achievement = this.selectedAchievement;
    if (!achievement || !achievement._id) return;

    this.activityService.updateStatus(achievement._id, 'مرفوض').subscribe({
      next: (res) => {
        if (res.success) {
          this.updateLocalStatus(achievement._id!, 'مرفوض');
          this.showRejectModal = false;
          Swal.fire('تم الرفض', 'تم رفض الإنجاز بنجاح', 'success');
        }
      },
      error: (err) => {
        console.error('Error rejecting activity:', err);
        Swal.fire('خطأ', 'تعذر رفض الإنجاز', 'error');
      },
    });
  }

  deleteActivity(id: string): void {
    if (!this.isAdmin) {
      Swal.fire('خطأ', 'ليس لديك صلاحية لهذا الإجراء', 'error');
      return;
    }

    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف هذا الإنجاز نهائيًا',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (result.isConfirmed) {
        this.activityService.delete(id).subscribe({
          next: (res) => {
            if (res.success) {
              this.achievements = this.achievements.filter((a) => a._id !== id);
              Swal.fire('تم الحذف', 'تم حذف الإنجاز بنجاح', 'success');
            }
          },
          error: (err) => {
            console.error('Error deleting activity:', err);
            Swal.fire('خطأ', 'تعذر حذف الإنجاز', 'error');
          },
        });
      }
    });
  }

  private updateLocalStatus(id: string, status: string): void {
    this.achievements = this.achievements.map((a) =>
      a._id === id ? { ...a, status } : a
    );
  }

  getNameField(field: any): string {
    if (!field) return 'غير محدد';
    return typeof field === 'object' ? field.name || 'غير محدد' : field;
  }

  getUserName(user: any): string {
    if (!user) return 'غير محدد';
    if (typeof user === 'string') return user;
    return user.name || 'غير محدد';
  }

  isImage(attachment: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(
      (ext) =>
        attachment.toLowerCase().endsWith(ext) ||
        attachment.toLowerCase().includes(ext)
    );
  }

  isPdf(attachment: string): boolean {
    return attachment.toLowerCase().includes('.pdf');
  }

  getFullAttachmentUrl(attachment: string): string {
    if (attachment.startsWith('http')) {
      return attachment;
    } else {
      return `http://localhost:3000${attachment}`;
    }
  }

  openImageModal(attachment: string): void {
    this.selectedImage = this.getFullAttachmentUrl(attachment);
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.selectedImage = '';
  }

  formatDate(dateString: string | Date | undefined | null): string {
    if (!dateString) return 'غير محدد';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'غير محدد';
      }

      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'غير محدد';
    }
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      معتمد: 'bg-success',
      'قيد المراجعة': 'bg-warning',
      مرفوض: 'bg-danger',
      مسودة: 'bg-secondary',
    };
    return statusClasses[status] || 'bg-secondary';
  }

  getStatusHeaderClass(status: string): string {
    const headerClasses: { [key: string]: string } = {
      معتمد: 'bg-gradient-success',
      'قيد المراجعة': 'bg-gradient-warning',
      مرفوض: 'bg-gradient-danger',
      مسودة: 'bg-gradient-secondary',
    };
    return headerClasses[status] || 'bg-gradient-primary';
  }
}
