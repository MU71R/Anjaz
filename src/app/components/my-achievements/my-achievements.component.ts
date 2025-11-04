import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../../service/achievements-service.service';
import { Activity } from 'src/app/model/achievement';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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

  constructor(
    private activityService: ActivityService,
    private sanitizer: DomSanitizer
  ) {}

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

  getCleanDescription(description: string): SafeHtml {
    if (!description) return 'لا يوجد وصف';

    let cleanHtml = description;
    if (description.includes('<') && description.includes('>')) {
      cleanHtml = this.cleanHTMLForDisplay(description);
    } else {
      cleanHtml = this.formatPlainText(description);
    }

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }

  private cleanHTMLForDisplay(html: string): string {
    if (!html) return '';

    return (
      html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') 
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') 
        .replace(/<link[^>]*>/gi, '') 
        .replace(/<meta[^>]*>/gi, '')
        .replace(/<div[^>]*>/g, '<div>') 
        .replace(/<p[^>]*>/g, '<p>') 
        .replace(/<br\s*\/?>/gi, '<br>') 
        .replace(/&nbsp;/g, ' ') 
        .replace(/\n/g, '<br>') 
        .trim()
    );
  }

  private formatPlainText(text: string): string {
    if (!text) return '';

    return text
      .split('\n')
      .map((paragraph) => {
        const trimmed = paragraph.trim();
        return trimmed ? `<p class="mb-2">${trimmed}</p>` : '';
      })
      .join('');
  }

  getShortDescription(description: string, length: number = 50): string {
    if (!description) return 'لا يوجد وصف';

    const plainText = description
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return plainText.length > length
      ? plainText.substring(0, length) + '...'
      : plainText;
  }

  filteredAchievements(): Activity[] {
    let list = [...this.achievements];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      list = list.filter(
        (a) =>
          a.activityTitle?.toLowerCase().includes(term) ||
          this.getCleanDescriptionText(a.activityDescription || '')
            .toLowerCase()
            .includes(term) ||
          a.name?.toLowerCase().includes(term) ||
          this.getFullName(a.user)?.toLowerCase().includes(term) || 
          this.getUserName(a.user)?.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter !== 'all') {
      list = list.filter((a) => a.status === this.statusFilter);
    }

    return list;
  }

  private getCleanDescriptionText(description: string): string {
    if (!description) return '';
    return description
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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

  getFullName(user: any): string {
    if (!user) return 'غير محدد';

    if (typeof user === 'string') return user;

    return user.fullname || user.name || 'غير محدد';
  }

  updateActivityStatus(
    id: string,
    status: 'معتمد' | 'قيد المراجعة' | 'مرفوض',
    reason?: string
  ): void {
    if (!this.isAdmin) {
      Swal.fire('خطأ', 'ليس لديك صلاحية لهذا الإجراء', 'error');
      return;
    }

    const updateData: any = { status };

    if (status === 'مرفوض') {
      updateData.reasonForRejection = reason || 'لم يتم تحديد سبب الرفض';
    }

    this.activityService.updateStatus(id, updateData).subscribe({
      next: (res) => {
        if (res.success) {
          this.updateLocalStatus(id, status, reason);

          let message = `تم تحديث الحالة إلى ${status}`;
          if (status === 'مرفوض' && reason) {
            message += ` مع سبب الرفض`;
          } else if (status === 'مرفوض') {
            message += ` بدون تحديد سبب`;
          }

          Swal.fire('تم', message, 'success');

          if (status === 'مرفوض') {
            this.closeRejectModal();
            this.closeDetailsModal();
          }
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

    if (
      this.rejectionReason &&
      this.rejectionReason.trim().length > 0 &&
      this.rejectionReason.trim().length < 5
    ) {
      Swal.fire(
        'تحذير',
        'إذا قمت بكتابة سبب الرفض، فيجب أن يكون على الأقل 5 أحرف',
        'warning'
      );
      return;
    }

    const reason = this.rejectionReason
      ? this.rejectionReason.trim()
      : undefined;
    this.updateActivityStatus(achievement._id, 'مرفوض', reason);
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

  private updateLocalStatus(id: string, status: string, reason?: string): void {
    this.achievements = this.achievements.map((a) =>
      a._id === id
        ? {
            ...a,
            status,
            ...(status === 'مرفوض' && {
              reasonForRejection: reason || 'لم يتم تحديد سبب الرفض',
            }),
          }
        : a
    );

    if (this.selectedAchievement && this.selectedAchievement._id === id) {
      this.selectedAchievement.status = status;
      if (status === 'مرفوض') {
        this.selectedAchievement.reasonForRejection =
          reason || 'لم يتم تحديد سبب الرفض';
      }
    }
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
