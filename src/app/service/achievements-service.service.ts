import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    if (token) {
      headers = headers.set('Authorization', token);
    }
    return headers;
  }

  addActivity(data: FormData): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.post<any>(`${this.API_BASE_URL}/add`, data, {
      headers: headers,
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

  getArchived(): Observable<{ success: boolean; data: Activity[] }> {
    return this.http.get<{ success: boolean; data: Activity[] }>(
      `${this.API_BASE_URL}/archived`,
      { headers: this.getAuthHeaders() }
    );
  }

  getDrafts(): Observable<{ success: boolean; data: Activity[] }> {
    return this.http.get<{ success: boolean; data: Activity[] }>(
      `${this.API_BASE_URL}/draft`,
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

  getArchivedActivities(): Observable<{ success: boolean; data: Activity[] }> {
    return this.http.get<{ success: boolean; data: Activity[] }>(
      `${this.API_BASE_URL}/archived`,
      { headers: this.getAuthHeaders() }
    );
  }

  getDraftActivities(): Observable<{ success: boolean; data: Activity[] }> {
    return this.http.get<{ success: boolean; data: Activity[] }>(
      `${this.API_BASE_URL}/draft`,
      { headers: this.getAuthHeaders() }
    );
  }

  // في achievement-service.service.ts
  getActivityById(id: string): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/${id}`);
  }

  updateActivity(id: string, activityData: FormData): Observable<any> {
    return this.http.put(`${this.API_BASE_URL}/update/${id}`, activityData);
  }

  // ===== إضافة في ActivityService =====
  getRecentAchievements(): Observable<
    { message: string; time: string; id: string }[]
  > {
    return this.http.get<{ message: string; time: string; id: string }[]>(
      `${this.API_BASE_URL}/recent-achievements`,
      { headers: this.getAuthHeaders() }
    );
  }
}
