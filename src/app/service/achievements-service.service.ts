import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Activity } from '../model/achievement';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private readonly API_BASE_URL = 'http://localhost:3000/activity';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', token);
    return headers;
  }

  addActivity(data: FormData): Observable<any> {
    return this.http.post<any>(`${this.API_BASE_URL}/add`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  // ✅ جلب جميع أنشطة المستخدم الحالي فقط
  getAll(): Observable<{ success: boolean; activities: Activity[] }> {
    return this.http.get<{ success: boolean; activities: Activity[] }>(
      `${this.API_BASE_URL}/all`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ جلب أنشطة المستخدم الحالي فقط
  getUserActivities(): Observable<{
    success: boolean;
    activities: Activity[];
  }> {
    return this.http.get<{ success: boolean; activities: Activity[] }>(
      `${this.API_BASE_URL}/user-activities`,
      { headers: this.getAuthHeaders() }
    );
  }

  getById(id: string): Observable<{ success: boolean; activity: Activity }> {
    return this.http.get<{ success: boolean; activity: Activity }>(
      `${this.API_BASE_URL}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateStatus(
    id: string,
    status: Activity['status']
  ): Observable<{ success: boolean; message: string; activity: Activity }> {
    return this.http.put<{
      success: boolean;
      message: string;
      activity: Activity;
    }>(
      `${this.API_BASE_URL}/update-status/${id}`,
      { status },
      {
        headers: this.getAuthHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  update(
    id: string,
    updates: Partial<Activity>
  ): Observable<{ success: boolean; message: string; activity: Activity }> {
    return this.http.put<{
      success: boolean;
      message: string;
      activity: Activity;
    }>(`${this.API_BASE_URL}/update/${id}`, updates, {
      headers: this.getAuthHeaders().set('Content-Type', 'application/json'),
    });
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.API_BASE_URL}/delete/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ الأرشيف للمستخدم الحالي فقط
  getArchived(): Observable<{ success: boolean; data: Activity[] }> {
    return this.http.get<{ success: boolean; data: Activity[] }>(
      `${this.API_BASE_URL}/user-archived`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ المسودات للمستخدم الحالي فقط
  getDrafts(): Observable<{ success: boolean; data: Activity[] }> {
    return this.http
      .get<{ success: boolean; data: Activity[] }>(
        `${this.API_BASE_URL}/user-drafts`,
        {
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(
        tap((response) => {
          console.log('[Service] User Drafts API Response:', response);
          if (response.success && response.data) {
            response.data.forEach((activity, index) => {
              console.log(`[Service] User Draft ${index + 1}:`, {
                title: activity.activityTitle,
                attachments: activity.Attachments,
                attachmentsCount: activity.Attachments?.length || 0,
                fullActivity: activity,
              });
            });
          }
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
        tap((response) => {
          console.log('[Service] Single Draft API Response:', response);
          if (response.success && response.activity) {
            console.log(
              '[Service] Draft Attachments:',
              response.activity.Attachments
            );
          }
        })
      );
  }

  // ✅ البحث في أنشطة المستخدم الحالي فقط
  search(query: string): Observable<{ success: boolean; data: Activity[] }> {
    const params = new HttpParams().set('query', query);
    return this.http.get<{ success: boolean; data: Activity[] }>(
      `${this.API_BASE_URL}/user-search`,
      { params, headers: this.getAuthHeaders() }
    );
  }

  // ✅ التصفية في أنشطة المستخدم الحالي فقط
  filterByStatus(
    status: Activity['status']
  ): Observable<{ success: boolean; data: Activity[] }> {
    const params = new HttpParams().set('status', status);
    return this.http.get<{ success: boolean; data: Activity[] }>(
      `${this.API_BASE_URL}/user-filter`,
      { params, headers: this.getAuthHeaders() }
    );
  }

  // ✅ الإنجازات الحديثة للمستخدم الحالي فقط
  getRecentAchievements(): Observable<
    { message: string; time: string; id: string }[]
  > {
    return this.http.get<{ message: string; time: string; id: string }[]>(
      `${this.API_BASE_URL}/user-recent-achievements`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ الإنجازات الحديثة لجميع المستخدمين (للمشرفين)
  getAllRecentAchievements(): Observable<
    { message: string; time: string; id: string }[]
  > {
    return this.http.get<{ message: string; time: string; id: string }[]>(
      `${this.API_BASE_URL}/recent-achievements`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateDraftActivity(
    id: string,
    updates: FormData | Partial<Activity>
  ): Observable<{ success: boolean; message: string; activity: Activity }> {
    return this.http.put<{
      success: boolean;
      message: string;
      activity: Activity;
    }>(`${this.API_BASE_URL}/update-draft/${id}`, updates, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteDraft(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.API_BASE_URL}/delete-draft/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ إحصائيات المستخدم الحالي
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
    return this.http.get<{
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
    });
  }
}
