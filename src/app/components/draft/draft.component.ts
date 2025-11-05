import { Component, OnInit } from '@angular/core';
import { ActivityService } from 'src/app/service/achievements-service.service';
import { Activity } from 'src/app/model/achievement';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-drafts',
  templateUrl: './draft.component.html',
  styleUrls: ['./draft.component.css'],
})
export class DraftsComponent implements OnInit {
  draftActivities: Activity[] = [];
  loading = true;
  selectedImage: string = '';
  showImageModal = false;

  constructor(
    private activityService: ActivityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkAuth();
    this.loadDrafts();
  }

  checkAuth(): void {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'لم يتم العثور على توكن المصادقة. يرجى تسجيل الدخول.',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#3085d6',
      }).then(() => {
        this.router.navigate(['/login']);
      });
      return;
    }
  }

  getCleanDescription(description: string): string {
    if (!description) return 'لا يوجد وصف';

    if (description.includes('<') && description.includes('>')) {
      return this.stripHtmlTags(description);
    }

    return description;
  }

  private stripHtmlTags(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  getMainCriteriaName(activity: Activity): string {
    return typeof activity.MainCriteria === 'object'
      ? activity.MainCriteria?.name || 'غير محدد'
      : activity.MainCriteria || 'غير محدد';
  }

  getSubCriteriaName(activity: Activity): string {
    return typeof activity.SubCriteria === 'object'
      ? activity.SubCriteria?.name || 'غير محدد'
      : activity.SubCriteria || 'غير محدد';
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'قيد المراجعة': 'bg-warning',
      معتمد: 'bg-success',
      مرفوض: 'bg-danger',
      مسودة: 'bg-secondary',
    };
    return statusClasses[status] || 'bg-secondary';
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
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'غير محدد';
    }
  }

  loadDrafts(): void {
    this.loading = true;
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');

    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى تسجيل الدخول أولاً',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#3085d6',
      }).then(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    this.activityService.getDrafts().subscribe({
      next: (response) => {
        console.log('Drafts response:', response);

        if (response.success) {
          this.draftActivities = response.data || [];
          console.log(
            'Loaded activities with attachments:',
            this.draftActivities
          );

          if (this.draftActivities.length === 0) {
            Swal.fire({
              icon: 'info',
              title: 'لا توجد مسودات',
              text: 'لا توجد مسودات لحفظها حالياً',
              confirmButtonText: 'حسناً',
              confirmButtonColor: '#3085d6',
            });
          }
        } else {
          const errorMessage = (response as any).message || 'Unknown error';
          Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل في تحميل المسودات: ' + errorMessage,
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#d33',
          });
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading drafts:', err);
        if (err.status === 401) {
          Swal.fire({
            icon: 'warning',
            title: 'انتهت الجلسة',
            text: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
            confirmButtonText: 'تسجيل الدخول',
            confirmButtonColor: '#3085d6',
          }).then(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            this.router.navigate(['/login']);
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في تحميل المسودات: ' + err.message,
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#d33',
          });
        }
        this.loading = false;
      },
    });
  }

  editDraft(activity: Activity): void {
    console.log('Editing draft:', activity);
    localStorage.setItem('editingDraft', JSON.stringify(activity));

    this.router.navigate(['/add-achievement'], {
      queryParams: {
        edit: 'true',
        draftId: activity._id,
      },
    });
  }

  deleteDraft(id: string): void {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من استعادة هذه المسودة بعد الحذف!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذفها',
      cancelButtonText: 'إلغاء',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.activityService.delete(id).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadDrafts();
              Swal.fire({
                title: 'تم الحذف!',
                text: 'تم حذف المسودة بنجاح.',
                icon: 'success',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'حسناً',
              });
            } else {
              const errorMessage = (response as any).message || 'Unknown error';
              Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'فشل في حذف المسودة: ' + errorMessage,
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#d33',
              });
            }
          },
          error: (err) => {
            console.error('Error deleting draft:', err);
            Swal.fire({
              icon: 'error',
              title: 'خطأ',
              text: 'فشل في حذف المسودة: ' + err.message,
              confirmButtonText: 'حسناً',
              confirmButtonColor: '#d33',
            });
          },
        });
      }
    });
  }
}
