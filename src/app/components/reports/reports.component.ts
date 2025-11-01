// src/app/components/reports/reports.component.ts
import { Component, OnInit } from '@angular/core';
import {
  ActivityService,
  PDFFile,
} from '../../service/achievements-service.service';
import { ReportFilter } from '../../model/achievement';
import {
  CriteriaService,
  MainCriteria,
  SubCriteria,
} from '../../service/criteria.service';
import { AdministrationService } from '../../service/user.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  showFilters: boolean = true;
  isLoading = false;
  isLoadingPDFs = false;
  showDateError = false;
  maxDate: string;

  filters: ReportFilter = {
    startDate: '',
    endDate: '',
    MainCriteria: '',
    SubCriteria: '',
    user: '',
    status: '',
  };

  generatedReport: any = null;
  pdfFiles: PDFFile[] = [];

  mainCriteriaList: MainCriteria[] = [];
  subCriteriaList: SubCriteria[] = [];
  allSubCriteria: SubCriteria[] = [];
  usersList: any[] = [];

  constructor(
    private activityService: ActivityService,
    private criteriaService: CriteriaService,
    private administrationService: AdministrationService
  ) {
    this.maxDate = new Date().toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadFilterData();
    this.loadAllPDFs();
    this.loadUsers();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  loadFilterData() {
    // تحميل المعايير الرئيسية
    this.criteriaService.getAllMainCriteria().subscribe({
      next: (mainCriteria: MainCriteria[]) => {
        this.mainCriteriaList = mainCriteria || [];
      },
      error: (err: any) => {
        console.error('❌ خطأ في تحميل المعايير الرئيسية:', err);
        this.showError('فشل في تحميل المعايير الرئيسية');
      },
    });

    // تحميل جميع المعايير الفرعية
    this.criteriaService.getAllSubCriteria().subscribe({
      next: (subCriteria: SubCriteria[]) => {
        this.allSubCriteria = subCriteria || [];
        this.subCriteriaList = [];
      },
      error: (err: any) => {
        console.error('❌ خطأ في تحميل المعايير الفرعية:', err);
        this.showError('فشل في تحميل المعايير الفرعية');
      },
    });
  }

  loadAllPDFs(): void {
    this.isLoadingPDFs = true;
    this.activityService.getAllPDFs().subscribe({
      next: (response) => {
        this.isLoadingPDFs = false;
        if (response.success) {
          this.pdfFiles = response.pdfFiles || [];
        } else {
          this.showError('فشل في تحميل التقارير السابقة');
        }
      },
      error: (error) => {
        this.isLoadingPDFs = false;
        console.error('❌ خطأ في تحميل ملفات PDF:', error);
        this.showError('حدث خطأ أثناء تحميل التقارير السابقة');
      },
    });
  }

  onMainCriteriaChange() {
    if (this.filters.MainCriteria) {
      this.subCriteriaList = this.allSubCriteria.filter((sub: SubCriteria) => {
        if (typeof sub.mainCriteria === 'object') {
          return (sub.mainCriteria as any)._id === this.filters.MainCriteria;
        } else {
          return sub.mainCriteria === this.filters.MainCriteria;
        }
      });

      // إعادة تعيين المعيار الفرعي إذا لم يكن متوافقاً
      if (this.filters.SubCriteria) {
        const exists = this.subCriteriaList.some(
          (sub: SubCriteria) => sub._id === this.filters.SubCriteria
        );
        if (!exists) {
          this.filters.SubCriteria = '';
        }
      }
    } else {
      this.subCriteriaList = [];
      this.filters.SubCriteria = '';
    }
  }

  generateReportWithValidation() {
    if (!this.validateFilters()) {
      return;
    }
    this.generateReport();
  }

  validateFilters(): boolean {
    if (this.filters.startDate && this.filters.endDate) {
      const startDate = new Date(this.filters.startDate);
      const endDate = new Date(this.filters.endDate);

      if (startDate > endDate) {
        this.showDateError = true;
        this.showError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
        return false;
      }
    }

    this.showDateError = false;
    return true;
  }

  generateReport() {
    if (this.hasEmptyFilters()) {
      const confirmGenerate = confirm(
        'لم تقم بتحديد أي فلاتر. هذا سيولد تقريراً بجميع الأنشطة.\nهل تريد المتابعة؟'
      );
      if (!confirmGenerate) {
        return;
      }
    }

    this.isLoading = true;
    this.generatedReport = null;

    const cleanFilters = this.cleanFiltersBeforeSend();

    this.activityService.generateAllActivitiesPDF(cleanFilters).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.generatedReport = response;

        if (response.success && response.file) {
          this.showSuccess('تم إنشاء التقرير بنجاح!');
          this.loadAllPDFs();
        } else {
          this.showError(response.message || 'فشل في إنشاء التقرير');
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('❌ خطأ في إنشاء التقرير:', error);
        this.showError('حدث خطأ أثناء إنشاء التقرير');
      },
    });
  }

  cleanFiltersBeforeSend(): any {
    const cleanedFilters: any = {};
    Object.keys(this.filters).forEach((key) => {
      const value = (this.filters as any)[key];
      if (value && value !== '') {
        cleanedFilters[key] = value;
      }
    });
    return cleanedFilters;
  }

  viewPDFReport(fileUrl: string) {
    try {
      const filename = this.extractFilenameFromUrl(fileUrl);
      if (filename) {
        this.activityService.openPDF(filename);
      } else {
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      window.open(fileUrl, '_blank');
    }
  }

  downloadPDF(fileUrl: string) {
    try {
      const filename = this.extractFilenameFromUrl(fileUrl);
      if (filename) {
        this.activityService.downloadPDF(
          filename,
          `تقرير_الأنشطة_${new Date().toISOString().split('T')[0]}.pdf`
        );
      } else {
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      window.open(fileUrl, '_blank');
    }
  }

  openPDF(pdfUrl: string): void {
    try {
      const filename = this.extractFilenameFromUrl(pdfUrl);
      if (filename) {
        this.activityService.openPDF(filename);
      } else {
        window.open(pdfUrl, '_blank');
      }
    } catch (error) {
      window.open(pdfUrl, '_blank');
    }
  }

  copyPDFLink(pdfUrl: string): void {
    navigator.clipboard
      .writeText(pdfUrl)
      .then(() => {
        this.showSuccess('تم نسخ رابط التقرير إلى الحافظة');
      })
      .catch((err) => {
        this.showError('فشل نسخ الرابط، يرجى المحاولة يدوياً');
      });
  }

  copyReportLink(fileUrl: string) {
    navigator.clipboard
      .writeText(fileUrl)
      .then(() => {
        this.showSuccess('تم نسخ رابط التقرير إلى الحافظة');
      })
      .catch((err) => {
        this.showError('فشل نسخ الرابط، يرجى المحاولة يدوياً');
      });
  }

  extractFilenameFromUrl(url: string): string {
    try {
      if (!url) return '';
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      return filename.split('?')[0];
    } catch (error) {
      return '';
    }
  }

  getShortUrl(url: string): string {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || url;
    } catch {
      return url.length > 50 ? url.substring(0, 50) + '...' : url;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  hasEmptyFilters(): boolean {
    return Object.values(this.filters).every((value) => !value || value === '');
  }

  clearFilters() {
    this.filters = {
      startDate: '',
      endDate: '',
      MainCriteria: '',
      SubCriteria: '',
      user: '',
      status: '',
    };
    this.subCriteriaList = [];
    this.generatedReport = null;
    this.showDateError = false;
    this.showSuccess('تم مسح جميع الفلاتر');
  }

  loadUsers() {
    this.administrationService.getAllUsers().subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.usersList = res;
        } else if (res && Array.isArray(res.users)) {
          this.usersList = res.users;
        } else if (res && Array.isArray(res.data)) {
          this.usersList = res.data;
        } else {
          console.error('❌ هيكل الاستجابة غير متوقع:', res);
          return;
        }

        this.usersList = this.usersList.filter(
          (user) => user.fullname && user.fullname.trim() !== ''
        );
      },
      error: (err: any) => {
        console.error('❌ خطأ في تحميل المستخدمين:', err);
        this.showError('فشل في تحميل قائمة المستخدمين');
      },
    });
  }

  getFilterSummary(): string {
    const parts = [];

    if (this.filters.startDate) parts.push(`من: ${this.filters.startDate}`);
    if (this.filters.endDate) parts.push(`إلى: ${this.filters.endDate}`);

    if (this.filters.MainCriteria) {
      const mainCriteria = this.mainCriteriaList.find(
        (c) => c._id === this.filters.MainCriteria
      );
      parts.push(`معيار رئيسي: ${mainCriteria?.name || 'غير معروف'}`);
    }

    if (this.filters.SubCriteria) {
      const subCriteria = this.allSubCriteria.find(
        (s) => s._id === this.filters.SubCriteria
      );
      parts.push(`معيار فرعي: ${subCriteria?.name || 'غير معروف'}`);
    }

    if (this.filters.status) {
      parts.push(`حالة: ${this.filters.status}`);
    }

    if (this.filters.user) {
      const user = this.usersList.find((u) => u._id === this.filters.user);
      parts.push(`مستخدم: ${user?.fullname || 'غير معروف'}`);
    }

    return parts.join(' | ') || 'جميع الأنشطة بدون فلاتر';
  }

  private showSuccess(message: string) {
    console.log('✅ ' + message);
    alert(message);
  }

  private showError(message: string) {
    console.error('❌ ' + message);
    alert('خطأ: ' + message);
  }
}
