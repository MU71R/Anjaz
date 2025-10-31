import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

  getAll(): Observable<{ success: boolean; activities: Activity[] }> {
    return this.http.get<{ success: boolean; activities: Activity[] }>(
      `${this.API_BASE_URL}/all`,
      { headers: this.getAuthHeaders() }
    );
  }

  getById(id: string): Observable<{ success: boolean; activity: Activity }> {
    return this.http.get<{ success: boolean; activity: Activity }>(
      `${this.API_BASE_URL}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  update(
    id: string,
    updates: FormData | Partial<Activity>
  ): Observable<{ success: boolean; message: string; activity: Activity }> {
    return this.http.put<{
      success: boolean;
      message: string;
      activity: Activity;
    }>(`${this.API_BASE_URL}/update/${id}`, updates, {
      headers: this.getAuthHeaders(),
    });
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

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.API_BASE_URL}/delete/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteDraft(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.API_BASE_URL}/delete-draft/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getDrafts(): Observable<{ success: boolean; data: Activity[] }> {
    return this.http
      .get<{ success: boolean; data: Activity[] }>(
        `${this.API_BASE_URL}/draft`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(tap((res) => console.log('[Service] Drafts:', res)));
  }

  getDraftById(
    id: string
  ): Observable<{ success: boolean; activity: Activity }> {
    return this.http.get<{ success: boolean; activity: Activity }>(
      `${this.API_BASE_URL}/draft/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getArchived(): Observable<{ success: boolean; data: Activity[] }> {
    return this.http.get<{ success: boolean; data: Activity[] }>(
      `${this.API_BASE_URL}/archived`,
      { headers: this.getAuthHeaders() }
    );
  }

  search(query: string): Observable<{ success: boolean; data: Activity[] }> {
    const params = new HttpParams().set('query', query);
    return this.http.get<{ success: boolean; data: Activity[] }>(
      `${this.API_BASE_URL}/search`,
      { params, headers: this.getAuthHeaders() }
    );
  }

  filterByStatus(
    status: Activity['status']
  ): Observable<{ success: boolean; data: Activity[] }> {
    const params = new HttpParams().set('status', status);
    return this.http.get<{ success: boolean; data: Activity[] }>(
      `${this.API_BASE_URL}/filter`,
      { params, headers: this.getAuthHeaders() }
    );
  }

  getRecentAchievements(): Observable<{
    success: boolean;
    activities: { message: string; time: string; id: string }[];
  }> {
    return this.http.get<{
      success: boolean;
      activities: { message: string; time: string; id: string }[];
    }>(`${this.API_BASE_URL}/recent-achievements`, {
      headers: this.getAuthHeaders(),
    });
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

 viewPDF(filename: string): Observable<Blob> {
  const url = `${this.API_BASE_URL}/pdf/${filename}`;
  const headers = this.getAuthHeaders();
  return this.http.get(url, {
    headers,
    responseType: 'blob',
  });
}


}
