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
  selectedImage = '';
  showImageModal = false;
  loadingPdf: string | null = null;
  loadingDocx: string | null = null;

  constructor(private activityService: ActivityService) {}

  ngOnInit(): void {
    this.loadArchivedActivities();
  }

  loadArchivedActivities(): void {
    this.activityService.getArchived().subscribe({
      next: (res) => {
        this.archivedActivities = res.data || [];
        this.loading = false;
        console.log('📦 Archived activities loaded:', this.archivedActivities);
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
    return user.fullname || user.name || 'غير محدد';
  }

  isImage(attachment: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some((ext) =>
      attachment.toLowerCase().includes(ext)
    );
  }

  isPdf(attachment: string): boolean {
    return attachment.toLowerCase().includes('.pdf');
  }

  getFullAttachmentUrl(attachment: string): string {
    return attachment.startsWith('http')
      ? attachment
      : `http://localhost:3000${attachment}`;
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
      if (isNaN(date.getTime())) return 'غير محدد';
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'غير محدد';
    }
  }

  // ✅ عرض PDF المولّد من السيرفر في نافذة جديدة
viewGeneratedPDF(activity: Activity): void {
  // لو مفيش generatedFiles استخدم أول مرفق من attachments
  const pdfUrl =
    activity.generatedFiles?.pdf ||
    activity.Attachments?.find((att: string) => att.toLowerCase().endsWith('.pdf'));

  if (!pdfUrl) {
    Swal.fire('info', 'لا يوجد ملف PDF متاح للعرض', 'info');
    return;
  }

  this.loadingPdf = activity._id || null;
  const filename = this.extractFilenameFromUrl(pdfUrl);

  if (!filename) {
    Swal.fire('خطأ', 'تعذر تحديد اسم الملف', 'error');
    this.loadingPdf = null;
    return;
  }

  this.activityService.viewPDF(filename).subscribe({
    next: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      this.loadingPdf = null;
    },
    error: (err) => {
      console.error('❌ خطأ في عرض PDF:', err);
      Swal.fire('خطأ', 'تعذر فتح ملف PDF', 'error');
      this.loadingPdf = null;
    },
  });
}


  // ✅ تحميل ملف Word (إن وجد)
  downloadGeneratedWord(activity: Activity): void {
    const docxUrl = activity.generatedFiles?.docx;

    if (!docxUrl) {
      Swal.fire('info', 'لا يوجد ملف Word متاح للتحميل', 'info');
      return;
    }

    this.loadingDocx = activity._id ?? null;

    const filename = this.extractFilenameFromUrl(docxUrl);
    if (!filename) {
      Swal.fire('خطأ', 'تعذر تحديد اسم الملف', 'error');
      this.loadingDocx = null;
      return;
    }

    const cleanTitle =
      activity.activityTitle?.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') ||
      'تقرير';
    const downloadName = `${cleanTitle}_${Date.now()}.docx`;

    this.activityService.viewPDF(filename).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadName;
        link.click();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);

        Swal.fire({
          icon: 'success',
          title: 'بدأ التحميل',
          text: 'جاري تحميل ملف Word',
          timer: 1500,
          showConfirmButton: false,
        });
        this.loadingDocx = null;
      },
      error: (err) => {
        console.error('❌ خطأ في تحميل Word:', err);
        this.downloadDirectFile(docxUrl, 'docx');
        this.loadingDocx = null;
      },
    });
  }

  // ✅ عرض مرفق PDF داخل نافذة جديدة
  viewAttachmentPDF(attachment: string): void {
    const filename = this.extractFilenameFromUrl(attachment);
    if (!filename) {
      Swal.fire('خطأ', 'تعذر تحديد اسم الملف', 'error');
      return;
    }

    this.activityService.viewPDF(filename).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      },
      error: (err) => {
        console.error('❌ خطأ في عرض مرفق PDF:', err);
        window.open(this.getFullAttachmentUrl(attachment), '_blank');
      },
    });
  }

  // 📎 استخراج اسم الملف من الرابط
  private extractFilenameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || null;
    } catch {
      return url.split('/').pop() || null;
    }
  }

  // 📥 تحميل مباشر احتياطي (في حال فشل blob)
  private downloadDirectFile(fileUrl: string, fileType: string): void {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `تقرير_${new Date().getTime()}.${fileType}`;
    link.click();

    Swal.fire({
      icon: 'success',
      title: 'بدأ التحميل',
      text: `جاري تحميل ملف ${fileType.toUpperCase()}`,
      timer: 1500,
      showConfirmButton: false,
    });
  }
}
