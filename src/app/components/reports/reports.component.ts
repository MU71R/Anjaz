import { Component, OnInit } from '@angular/core';
import {
  ActivityService,
  PDFFile,
  ReportFilters,
  ReportGenerationResponse,
} from '../../service/achievements-service.service';
import {
  CriteriaService,
  MainCriteria,
  SubCriteria,
} from '../../service/criteria.service';
import { AdministrationService } from '../../service/user.service';
import Swal from 'sweetalert2';

interface ReportFilter {
  startDate: string;
  endDate: string;
  MainCriteria?: string;
  SubCriteria?: string;
  user?: string;
  status?: string;
}

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
  dateRequiredError = false;
  maxDate: string;
  currentDate: string;
  reportType: 'pdf' | 'docx' = 'pdf';
  fileTypeFilter: string = 'all';
  filteredPDFs: PDFFile[] = [];

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
    this.currentDate = new Date().toISOString();
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
          this.filterPDFs();
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

  filterPDFs(): void {
    if (this.fileTypeFilter === 'all') {
      this.filteredPDFs = this.pdfFiles;
    } else {
      this.filteredPDFs = this.pdfFiles.filter(
        (pdf) => this.getFileType(pdf) === this.fileTypeFilter
      );
    }
  }

  getFileType(pdf: PDFFile): 'pdf' | 'docx' {
    return this.activityService.getFileTypeFromFilename(pdf.pdfurl);
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

      const today = new Date();
      if (startDate > today || endDate > today) {
        this.showDateError = true;
        this.dateRequiredError = false;
        this.showError('لا يمكن اختيار تاريخ في المستقبل');
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

    let reportObservable;

    if (this.reportType === 'pdf') {
      reportObservable =
        this.activityService.generateAllActivitiesPDF(cleanFilters);
    } else {
      reportObservable =
        this.activityService.generateAllActivitiesDOCX(cleanFilters);
    }

    reportObservable.subscribe({
      next: (response: ReportGenerationResponse) => {
        this.isLoading = false;
        this.generatedReport = {
          ...response,
          fileType: this.reportType,
        };

        if (response.success && response.file) {
          this.currentDate = new Date().toISOString();

          this.showSuccess(
            `تم إنشاء التقرير ${
              this.reportType === 'pdf' ? 'PDF' : 'DOCX'
            } بنجاح!`
          );
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

        let errorMessage = 'حدث خطأ أثناء إنشاء التقرير';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.generatedReport = {
          success: false,
          message: errorMessage,
        };
        this.showReportResults = true;
        this.scrollToElement('report-results');
      },
    });
  }

  cleanFiltersBeforeSend(): any {
    const cleanedFilters: any = {};

    cleanedFilters.startDate = this.filters.startDate;
    cleanedFilters.endDate = this.filters.endDate;

    if (this.filters.MainCriteria)
      cleanedFilters.MainCriteria = this.filters.MainCriteria;
    if (this.filters.SubCriteria)
      cleanedFilters.SubCriteria = this.filters.SubCriteria;
    if (this.filters.user) cleanedFilters.user = this.filters.user;
    if (this.filters.status) cleanedFilters.status = this.filters.status;

    return cleanedFilters;
  }

  viewReport(fileUrl: string, fileType: 'pdf' | 'docx') {
    try {
      if (fileType === 'pdf') {
        const filename = this.extractFilenameFromUrl(fileUrl);
        this.activityService.openPDF(filename);
      } else {
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      console.error('خطأ في فتح الملف:', error);
      this.showError('حدث خطأ أثناء فتح الملف');
    }
  }

  downloadReport(fileUrl: string, fileType: 'pdf' | 'docx') {
    try {
      if (fileType === 'pdf') {
        const filename = this.extractFilenameFromUrl(fileUrl);
        this.activityService.downloadPDF(
          filename,
          `تقرير_الأنشطة_${new Date().toISOString().split('T')[0]}.pdf`
        );
      } else {
        this.activityService.downloadDOCXFromUrl(
          fileUrl,
          `تقرير_الأنشطة_${new Date().toISOString().split('T')[0]}.docx`
        );
      }
    } catch (error) {
      console.error('خطأ في تحميل الملف:', error);
      this.showError('حدث خطأ أثناء تحميل الملف');
    }
  }

  openReport(pdfUrl: string, fileType: 'pdf' | 'docx'): void {
    try {
      if (fileType === 'pdf') {
        const filename = this.extractFilenameFromUrl(pdfUrl);
        this.activityService.openPDF(filename);
      } else {
        window.open(pdfUrl, '_blank');
      }
    } catch (error) {
      console.error('خطأ في فتح الملف:', error);
      this.showError('حدث خطأ أثناء فتح الملف');
    }
  }

  

  extractFilenameFromUrl(url: string): string {
    return this.activityService.extractFilenameFromUrl(url);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  getUserDisplayName(pdf: PDFFile): string {
    if (pdf.userId && pdf.userId.fullname) {
      return pdf.userId.fullname;
    }
    return 'مستخدم غير معروف';
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
    this.reportType = 'pdf';
    this.subCriteriaList = [];
    this.generatedReport = null;
    this.showDateError = false;
    this.dateRequiredError = false;
    this.showSuccess('تم مسح جميع الفلاتر');
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

  getCurrentUserName(): string {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.fullname || 'المستخدم الحالي';
      } catch {
        return 'المستخدم الحالي';
      }
    }
    return 'المستخدم الحالي';
  }

  getFilterSummary(): string {
    const parts = [];

    parts.push(`نوع: ${this.reportType === 'pdf' ? 'PDF' : 'DOCX'}`);

    if (this.filters.startDate)
      parts.push(`من: ${this.formatDate(this.filters.startDate)}`);
    if (this.filters.endDate)
      parts.push(`إلى: ${this.formatDate(this.filters.endDate)}`);

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
    Swal.fire({
      title: 'نجح!',
      text: message,
      icon: 'success',
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#3085d6',
    });
  }

  private showError(message: string) {
    Swal.fire({
      title: 'خطأ!',
      text: message,
      icon: 'error',
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#d33',
    });
  }

  private showInfo(message: string) {
    Swal.fire({
      title: 'معلومة',
      text: message,
      icon: 'info',
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#3085d6',
    });
  }
}
