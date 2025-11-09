import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap, throwError, catchError } from 'rxjs';
import { Activity } from '../model/achievement';
import { environment } from '../environments/environments.pord';

// في service/achievements-service.service.ts
export interface PDFFile {
  _id?: string;
  pdfurl: string;
  userId: {
    _id: string;
    fullname: string;
  };
  createdAt: string;
  // إضافة الخصائص الجديدة
  generatedBy?: string;
  generatedAt?: string;
  filename?: string;
  fileType?: 'pdf' | 'docx';
  reportType?: string;
  criteria?: string;
  period?: string;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  MainCriteria?: string;
  SubCriteria?: string;
  user?: string;
  status?: string;
  reportType?: 'pdf' | 'docx';
}

export interface ReportGenerationResponse {
  success: boolean;
  message: string;
  file: string;
  count?: number;
  filename?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private readonly API_BASE_URL = `${environment.apiUrl}/activity`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');

    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', token);
    }
    return headers;
  }

  // ========== إدارة ملفات PDF ==========
  getAllPDFs(): Observable<{ success: boolean; pdfFiles: PDFFile[] }> {
    const headers = this.getAuthHeaders();

    if (!headers.has('Authorization')) {
      return throwError(() => new Error('لم يتم العثور على توكن المصادقة'));
    }

    return this.http
      .get<{ success: boolean; pdfFiles: PDFFile[] }>(
        `${this.API_BASE_URL}/all-pdfs`,
        {
          headers,
        }
      )
      .pipe(
        catchError((error) => {
          console.error('PDFs Error:', error);
          if (error.status === 401) {
            this.handleUnauthorized();
          }
          return throwError(() => error);
        })
      );
  }

  // في الـ Service - أضف هذه الدالة
  downloadDOCXFromUrl(fileUrl: string, customName?: string): void {
    try {
      console.log('Downloading DOCX from URL:', fileUrl);

      // استخدام الرابط مباشرة بدون أي تعديل
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download =
        customName ||
        this.extractFilenameFromUrl(fileUrl) ||
        `تقرير_${new Date().getTime()}.docx`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      // إضافة الـ link للصفحة ونقره ثم إزالته
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading DOCX from URL:', error);

      // محاولة بديلة باستخدام window.open
      try {
        window.open(fileUrl, '_blank');
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        alert('خطأ في تحميل ملف DOCX. يرجى المحاولة مرة أخرى');
      }
    }
  }

  deletePDF(pdfId: string): Observable<{ success: boolean; message: string }> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${this.API_BASE_URL}/pdfs/${pdfId}`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Delete PDF Error:', error);
          return throwError(() => error);
        })
      );
  }

  // ========== إنشاء التقارير ==========
  generateReport(filters: ReportFilters): Observable<ReportGenerationResponse> {
    let params = new HttpParams()
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);

    // إضافة الفلاتر الاختيارية
    if (filters.MainCriteria) {
      params = params.set('MainCriteria', filters.MainCriteria);
    }
    if (filters.SubCriteria) {
      params = params.set('SubCriteria', filters.SubCriteria);
    }
    if (filters.user) {
      params = params.set('user', filters.user);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }

    // تحديد نوع التقرير (PDF أو DOCX)
    const endpoint =
      filters.reportType === 'docx' ? 'generate-docx' : 'generate-pdf';

    return this.http
      .get<ReportGenerationResponse>(`${this.API_BASE_URL}/${endpoint}`, {
        params,
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((response) => {
          if (response.success && response.file) {
            response.file = this.fixArabicUrl(response.file);
            response.filename = this.extractFilenameFromUrl(response.file);
          }
        }),
        catchError((error) => {
          console.error('Generate Report Error:', error);
          return throwError(() => error);
        })
      );
  }

  generateAllActivitiesPDF(
    filters?: any
  ): Observable<ReportGenerationResponse> {
    let params = new HttpParams();

    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<ReportGenerationResponse>(`${this.API_BASE_URL}/generate-pdf`, {
        params,
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((response) => {
          if (response.success && response.file) {
            response.file = this.fixArabicUrl(response.file);
            response.filename = this.extractFilenameFromUrl(response.file);
          }
        }),
        catchError((error) => {
          console.error('Generate PDF Error:', error);
          return throwError(() => error);
        })
      );
  }

  generateAllActivitiesDOCX(
    filters?: any
  ): Observable<ReportGenerationResponse> {
    let params = new HttpParams();

    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<ReportGenerationResponse>(`${this.API_BASE_URL}/generate-docx`, {
        params,
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((response) => {
          if (response.success && response.file) {
            response.file = this.fixArabicUrl(response.file);
            response.filename = this.extractFilenameFromUrl(response.file);
          }
        }),
        catchError((error) => {
          console.error('Generate DOCX Error:', error);
          return throwError(() => error);
        })
      );
  }

  // ========== معاينة وتحميل الملفات ==========
  viewPDF(filename: string): Observable<Blob> {
    const url = `${this.API_BASE_URL}/view-pdf/${filename}`;
    const headers = this.getAuthHeaders();
    return this.http
      .get(url, {
        headers,
        responseType: 'blob',
      })
      .pipe(
        catchError((error) => {
          console.error('View PDF Error:', error);
          return throwError(() => error);
        })
      );
  }

  openPDF(filename: string): void {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    const url = `${this.API_BASE_URL}/view-pdf/${filename}`;

    if (token) {
      window.open(url, '_blank');
    }
  }

  downloadPDF(filename: string, customName?: string): void {
    this.viewPDF(filename).subscribe(
      (blob: Blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = customName || filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      },
      (error) => {
        console.error('Error downloading PDF:', error);
        alert('خطأ في تحميل الملف');
      }
    );
  }

  // ========== تحميل DOCX مباشرة من الـ URL ==========
  // وأعدل الدالة downloadDOCXDirectly
  downloadDOCXDirectly(fileUrl: string, customName?: string): void {
    this.downloadDOCXFromUrl(fileUrl, customName);
  }

  // ========== معالجة الملفات والروابط ==========
  private fixArabicUrl(url: string): string {
    try {
      if (url.includes('%25')) {
        return decodeURIComponent(url);
      }
      if (url.includes('%')) {
        return decodeURI(url);
      }
      return url;
    } catch (error) {
      console.warn('Error decoding URL:', error);
      return url;
    }
  }

  // في الـ Service - أضف هذه الدالة
  async downloadDOCXWithFetch(
    fileUrl: string,
    customName?: string
  ): Promise<void> {
    try {
      console.log('Fetching DOCX from:', fileUrl);

      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      // إنشاء رابط تحميل
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download =
        customName ||
        this.extractFilenameFromUrl(fileUrl) ||
        `تقرير_${new Date().getTime()}.docx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // تنظيف الذاكرة
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100);
    } catch (error) {
      console.error('Error downloading DOCX with fetch:', error);

      // الرجوع للطريقة العادية
      this.downloadDOCXFromUrl(fileUrl, customName);
    }
  }

  extractFilenameFromUrl(url: string): string {
    if (!url) return 'report.pdf';

    try {
      const urlParts = url.split('/');
      return urlParts[urlParts.length - 1];
    } catch (error) {
      console.warn('Error extracting filename:', error);
      return 'report.pdf';
    }
  }

  getFileTypeFromFilename(filename: string): 'pdf' | 'docx' {
    return filename.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';
  }

  // ========== التعامل مع نتائج التقرير ==========
  handleGeneratedReport(response: ReportGenerationResponse): void {
    if (response.success && response.file && response.filename) {
      const fileType = this.getFileTypeFromFilename(response.filename);

      if (confirm(`تم إنشاء التقرير بنجاح. هل تريد فتحه الآن؟`)) {
        if (fileType === 'pdf') {
          this.openPDF(response.filename!);
        } else {
          // لـ DOCX نستخدم التحميل المباشر
          this.downloadDOCXDirectly(response.file);
        }
      } else {
        const defaultName = `تقرير_الانجازات_${
          new Date().toISOString().split('T')[0]
        }.${fileType}`;
        if (fileType === 'pdf') {
          this.downloadPDF(response.filename!, defaultName);
        } else {
          this.downloadDOCXDirectly(response.file, defaultName);
        }
      }
    }
  }

  handleGeneratedPDF(pdfResponse: any): void {
    if (pdfResponse.success && pdfResponse.file) {
      const filename = this.extractFilenameFromUrl(pdfResponse.file);
      if (confirm('تم إنشاء التقرير بنجاح. هل تريد فتحه الآن؟')) {
        this.openPDF(filename);
      } else {
        this.downloadPDF(
          filename,
          `تقرير_الانجازات_${new Date().toISOString().split('T')[0]}.pdf`
        );
      }
    }
  }

  // ========== إحصائيات التقارير ==========
  getReportStats(): Observable<{
    success: boolean;
    data: {
      totalReports: number;
      pdfCount: number;
      docxCount: number;
      lastGenerated: string;
      mostActiveUser: string;
    };
  }> {
    return this.http
      .get<{
        success: boolean;
        data: {
          totalReports: number;
          pdfCount: number;
          docxCount: number;
          lastGenerated: string;
          mostActiveUser: string;
        };
      }>(`${this.API_BASE_URL}/report-stats`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Get Report Stats Error:', error);
          return throwError(() => error);
        })
      );
  }

  // ========== أدوات مساعدة ==========
  cleanDescriptionForDisplay(description: string): string {
    if (!description) return '';
    if (description.includes('<') && description.includes('>')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = description;
      return tempDiv.textContent || tempDiv.innerText || description;
    }
    return description;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getReportDisplayName(filename: string): string {
    const name = filename.replace(/_/g, ' ').replace(/\.(pdf|docx)$/i, '');
    return name || 'تقرير بدون اسم';
  }

  // ========== الأمان ==========
  private handleUnauthorized(): void {
    console.warn('Unauthorized access - clearing storage');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  }

  // ========== باقي دوال إدارة الأنشطة (كما هي) ==========
  addActivity(data: FormData): Observable<any> {
    return this.http
      .post<any>(`${this.API_BASE_URL}/add`, data, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Add Activity Error:', error);
          return throwError(() => error);
        })
      );
  }

  getAll(): Observable<{ success: boolean; activities: Activity[] }> {
    return this.http
      .get<{ success: boolean; activities: Activity[] }>(
        `${this.API_BASE_URL}/all`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Get All Activities Error:', error);
          return throwError(() => error);
        })
      );
  }

  getById(id: string): Observable<{ success: boolean; activity: Activity }> {
    return this.http
      .get<{ success: boolean; activity: Activity }>(
        `${this.API_BASE_URL}/${id}`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Get Activity By ID Error:', error);
          return throwError(() => error);
        })
      );
  }

  update(
    id: string,
    updates: FormData | Partial<Activity>
  ): Observable<{ success: boolean; message: string; activity: Activity }> {
    return this.http
      .put<{
        success: boolean;
        message: string;
        activity: Activity;
      }>(`${this.API_BASE_URL}/update/${id}`, updates, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Update Activity Error:', error);
          return throwError(() => error);
        })
      );
  }

  updateDraftActivity(
    id: string,
    updates: FormData | Partial<Activity>
  ): Observable<{ success: boolean; message: string; activity: Activity }> {
    return this.http
      .put<{
        success: boolean;
        message: string;
        activity: Activity;
      }>(`${this.API_BASE_URL}/update-draft/${id}`, updates, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Update Draft Activity Error:', error);
          return throwError(() => error);
        })
      );
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${this.API_BASE_URL}/delete/${id}`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Delete Activity Error:', error);
          return throwError(() => error);
        })
      );
  }

  deleteDraft(id: string): Observable<{ success: boolean; message: string }> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${this.API_BASE_URL}/delete-draft/${id}`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Delete Draft Error:', error);
          return throwError(() => error);
        })
      );
  }

  getDrafts(): Observable<{ success: boolean; data: Activity[] }> {
    return this.http
      .get<{ success: boolean; data: Activity[] }>(
        `${this.API_BASE_URL}/draft`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Get Drafts Error:', error);
          return throwError(() => error);
        })
      );
  }

  getDraftById(
    id: string
  ): Observable<{ success: boolean; activity: Activity }> {
    return this.http
      .get<{ success: boolean; activity: Activity }>(
        `${this.API_BASE_URL}/draft/${id}`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Get Draft By ID Error:', error);
          return throwError(() => error);
        })
      );
  }

  getArchived(): Observable<{ success: boolean; data: Activity[] }> {
    return this.http
      .get<{ success: boolean; data: Activity[] }>(
        `${this.API_BASE_URL}/archived`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Get Archived Error:', error);
          return throwError(() => error);
        })
      );
  }

  search(query: string): Observable<{ success: boolean; data: Activity[] }> {
    const params = new HttpParams().set('query', query);
    return this.http
      .get<{ success: boolean; data: Activity[] }>(
        `${this.API_BASE_URL}/search`,
        { params, headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Search Error:', error);
          return throwError(() => error);
        })
      );
  }

  filterByStatus(
    status: Activity['status']
  ): Observable<{ success: boolean; data: Activity[] }> {
    const params = new HttpParams().set('status', status);
    return this.http
      .get<{ success: boolean; data: Activity[] }>(
        `${this.API_BASE_URL}/filter`,
        { params, headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Filter By Status Error:', error);
          return throwError(() => error);
        })
      );
  }

  getRecentAchievements(): Observable<{
    success: boolean;
    activities: { message: string; time: string; id: string }[];
  }> {
    return this.http
      .get<{
        success: boolean;
        activities: { message: string; time: string; id: string }[];
      }>(`${this.API_BASE_URL}/recent-achievements`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Get Recent Achievements Error:', error);
          return throwError(() => error);
        })
      );
  }

  updateStatus(
    id: string,
    data: { status: Activity['status']; reasonForRejection?: string }
  ): Observable<{ success: boolean; message: string; activity: Activity }> {
    return this.http
      .put<{
        success: boolean;
        message: string;
        activity: Activity;
      }>(`${this.API_BASE_URL}/update-status/${id}`, data, {
        headers: this.getAuthHeaders().set('Content-Type', 'application/json'),
      })
      .pipe(
        catchError((error) => {
          console.error('Update Status Error:', error);
          return throwError(() => error);
        })
      );
  }

  getUserStats(): Observable<{
    success: boolean;
    data: {
      totalActivities: number;
      pendingActivities: number;
      approvedActivities: number;
      rejectedActivities: number;
      draftActivities: number;
    };
  }> {
    return this.http
      .get<{
        success: boolean;
        data: {
          totalActivities: number;
          pendingActivities: number;
          approvedActivities: number;
          rejectedActivities: number;
          draftActivities: number;
        };
      }>(`${this.API_BASE_URL}/user-stats`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Get User Stats Error:', error);
          return throwError(() => error);
        })
      );
  }
}
