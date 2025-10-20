import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Department, Sector } from '../model/user';

@Injectable({
  providedIn: 'root',
})
export class AdministrationService {
  private baseUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/all-users`, {
      headers: this.getAuthHeaders(),
    });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/user/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  addDepartment(department: Department): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/adddepartment`, department, {
      headers: this.getAuthHeaders(),
    });
  }

  updateDepartmentStatus(
    id: string,
    status: 'active' | 'inactive'
  ): Observable<User> {
    return this.http.put<User>(
      `${this.baseUrl}/update-status/${id}`,
      { status },
      { headers: this.getAuthHeaders() }
    );
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/update-user/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteUser(id: string): Observable<User> {
    return this.http.delete<User>(`${this.baseUrl}/delete-user/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getStats(): Observable<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  }> {
    return this.http.get<{
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
    }>(`${this.baseUrl}/stats`, { headers: this.getAuthHeaders() });
  }

  addSector(sector: Sector): Observable<Sector> {
    return this.http.post<Sector>(
      `${this.baseUrl}/addsector`,
      { sector: sector.sector },
      { headers: this.getAuthHeaders() }
    );
  }

  getAllSectors(): Observable<Sector[]> {
    return this.http.get<Sector[]>(`${this.baseUrl}/all-sectors`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateSector(id: string, updateData: Partial<Sector>): Observable<Sector> {
    return this.http.put<Sector>(
      `${this.baseUrl}/update-sector/${id}`,
      updateData,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  deleteSector(id: string): Observable<Sector> {
    return this.http.delete<Sector>(`${this.baseUrl}/delete-sector/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
}
