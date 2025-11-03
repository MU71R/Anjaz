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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  showFilters: boolean = false;
  isLoading = false;
  isLoadingPDFs = false;
  showDateError = false;
  dateRequiredError = false;
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
  selectedPDF: PDFFile | null = null;

  mainCriteriaList: MainCriteria[] = [];
  subCriteriaList: SubCriteria[] = [];
  allSubCriteria: SubCriteria[] = [];
  usersList: any[] = [];
  showReportResults = false;
  showPreviousReports = true;

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

  toggleReportResults(): void {
    this.showReportResults = !this.showReportResults;
    if (this.showReportResults) {
      this.scrollToElement('report-results');
    }
  }

  togglePreviousReports(): void {
    this.showPreviousReports = !this.showPreviousReports;
  }

  loadFilterData() {
    this.criteriaService.getAllMainCriteria().subscribe({
      next: (mainCriteria: MainCriteria[]) => {
        this.mainCriteriaList = mainCriteria || [];
      },
      error: (err: any) => {
        console.error('خطأ في تحميل المعايير الرئيسية:', err);
        this.showError('فشل في تحميل المعايير الرئيسية');
      },
    });

    this.criteriaService.getAllSubCriteria().subscribe({
      next: (subCriteria: SubCriteria[]) => {
        this.allSubCriteria = subCriteria || [];
        this.subCriteriaList = [];
      },
      error: (err: any) => {
        console.error('خطأ في تحميل المعايير الفرعية:', err);
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
        console.error('خطأ في تحميل ملفات PDF:', error);
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
    if (!this.filters.startDate || !this.filters.endDate) {
      this.dateRequiredError = true;
      this.showError('تاريخ البداية وتاريخ النهاية مطلوبان');
      return false;
    }

    if (this.filters.startDate && this.filters.endDate) {
      const startDate = new Date(this.filters.startDate);
      const endDate = new Date(this.filters.endDate);

      if (startDate > endDate) {
        this.showDateError = true;
        this.dateRequiredError = false;
        this.showError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
        return false;
      }
    }

    this.showDateError = false;
    this.dateRequiredError = false;
    return true;
  }

  async generateReport() {
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
          this.showReportResults = true;
          this.scrollToElement('report-results');
        } else {
          const errorMessage = response.message || 'فشل في إنشاء التقرير';
          this.showError(errorMessage);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('خطأ في إنشاء التقرير:', error);
        if (error.error && error.error.message) {
          this.showError(error.error.message);
        } else if (error.message) {
          this.showError(error.message);
        } else {
          this.showError('حدث خطأ أثناء إنشاء التقرير');
        }
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

  clearFilters() {
    this.filters = {
      startDate: this.filters.startDate, 
      endDate: this.filters.endDate, 
      MainCriteria: '',
      SubCriteria: '',
      user: '',
      status: '',
    };
    this.subCriteriaList = [];
    this.generatedReport = null;
    this.showDateError = false;
    this.dateRequiredError = false;
    this.showSuccess('تم مسح الفلاتر الاختيارية');
  }

  clearDates() {
    this.filters.startDate = '';
    this.filters.endDate = '';
    this.dateRequiredError = false;
    this.showDateError = false;
  }

  isDateComplete(): boolean {
    return !!(this.filters.startDate && this.filters.endDate);
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
          console.error('هيكل الاستجابة غير متوقع:', res);
          return;
        }

        this.usersList = this.usersList.filter(
          (user) => user.fullname && user.fullname.trim() !== ''
        );
      },
      error: (err: any) => {
        console.error('خطأ في تحميل المستخدمين:', err);
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

    return parts.join(' | ') || 'جميع الأنشطة في النطاق الزمني المحدد';
  }

  private scrollToElement(elementId: string) {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  private showSuccess(message: string) {
    console.log(message);
    Swal.fire({
      title: 'نجح!',
      text: message,
      icon: 'success',
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#3085d6',
    });
  }

  private showError(message: string) {
    console.error(message);
    Swal.fire({
      title: 'خطأ!',
      text: message,
      icon: 'error',
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#d33',
    });
  }
}
