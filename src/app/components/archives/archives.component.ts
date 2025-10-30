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
  selectedImage: string = '';
  showImageModal = false;

  constructor(private activityService: ActivityService) {}

  ngOnInit(): void {
    this.loadArchivedActivities();
  }

  loadArchivedActivities(): void {
    this.activityService.getArchived().subscribe({
      next: (res) => {
        this.archivedActivities = res.data || [];
        this.loading = false;
        console.log('Archived activities loaded:', this.archivedActivities);
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
    if (!criteria) return 'غير محدد';
    if (typeof criteria === 'string') return criteria;
    return criteria.name || 'غير محدد';
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
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'غير محدد';
    }
  }

  downloadAsPDF(activity: Activity): void {
    const pdfUrl = this.getFullAttachmentUrl(
      activity.Attachments?.find((att) => att.includes('.pdf')) || ''
    );
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      Swal.fire('info', 'لا يوجد ملف PDF متاح للتحميل', 'info');
    }
  }

  downloadAsWord(activity: Activity): void {
    const wordUrl = this.getFullAttachmentUrl(
      activity.Attachments?.find(
        (att) => att.includes('.docx') || att.includes('.doc')
      ) || ''
    );
    if (wordUrl) {
      window.open(wordUrl, '_blank');
    } else {
      Swal.fire('info', 'لا يوجد ملف Word متاح للتحميل', 'info');
    }
  }
}
