import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap, throwError, catchError } from 'rxjs';
import { Activity } from '../model/achievement';
export interface PDFFile {
  _id: string;
  userId: {
    _id: string;
    fullname: string;
    name: string;
    role: string;
  };
  pdfurl: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private readonly API_BASE_URL = 'http://localhost:3000/activity';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');

    console.log('Token being used:', token ? 'Exists' : 'Missing');

    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', token);
    }
    return headers;
  }

  getAllPDFs(): Observable<{ success: boolean; pdfFiles: PDFFile[] }> {
    const headers = this.getAuthHeaders();

    if (!headers.has('Authorization')) {
      console.error('No token found for getAllPDFs');
      return throwError(() => new Error('لم يتم العثور على توكن المصادقة'));
    }

    console.log('Headers for getAllPDFs:', headers);

    return this.http
      .get<{ success: boolean; pdfFiles: PDFFile[] }>(
        `${this.API_BASE_URL}/all-pdfs`,
        {
          headers,
        }
      )
      .pipe(
        tap((response) => console.log('PDFs Response:', response)),
        catchError((error) => {
          console.error('PDFs Error:', error);
          if (error.status === 401) {
            this.handleUnauthorized();
          }
          return throwError(() => error);
        })
      );
  }

  private handleUnauthorized(): void {
    console.warn('Unauthorized access - clearing storage');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  }

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
        tap((res) => console.log('[Service] Drafts:', res)),
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
    status: Activity['status']
  ): Observable<{ success: boolean; message: string; activity: Activity }> {
    return this.http
      .put<{
        success: boolean;
        message: string;
        activity: Activity;
      }>(
        `${this.API_BASE_URL}/update-status/${id}`,
        { status },
        {
          headers: this.getAuthHeaders().set(
            'Content-Type',
            'application/json'
          ),
        }
      )
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
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.display = 'none';

      document.body.appendChild(iframe);
      window.open(url, '_blank');
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }
  }

  downloadPDF(filename: string, customName?: string): void {
    this.viewPDF(filename).subscribe(
      (blob: Blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = customName || filename;
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
      },
      (error) => {
        console.error('Error downloading PDF:', error);
        alert('خطأ في تحميل الملف');
      }
    );
  }

  cleanDescriptionForDisplay(description: string): string {
    if (!description) return '';
    if (description.includes('<') && description.includes('>')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = description;
      return tempDiv.textContent || tempDiv.innerText || description;
    }
    return description;
  }

  generateAllActivitiesPDF(filters?: any): Observable<{
    success: boolean;
    message: string;
    file: string;
    count: number;
  }> {
    let params = new HttpParams();

    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<{ success: boolean; message: string; file: string; count: number }>(
        `${this.API_BASE_URL}/generate-pdf`,
        {
          params,
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(
        tap((response) => {
          if (response.success && response.file) {
            response.file = this.fixArabicUrl(response.file);
          }
        }),
        catchError((error) => {
          console.error('Generate PDF Error:', error);
          return throwError(() => error);
        })
      );
  }

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
}
