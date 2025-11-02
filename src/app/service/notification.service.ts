import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Notification } from '../model/notification';
import { environment } from '../environments/environments.pord';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private socket!: Socket;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private API_URL = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {
    this.requestNotificationPermission();
    this.fetchNotificationsFromServer();
    this.socket = io(`${environment.apiUrl}`, {
      transports: ['websocket', 'polling'],
    });

    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user._id) {
        this.socket.emit('registerUser', user._id); 
        console.log('Registered user room:', user._id);
      }
    }
    this.socket.on('notification', (notification: Notification) => {
      this.addNotification(notification);
      this.showBrowserNotification(notification.title, notification.message);
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `${token}`,
    });
  }

  fetchNotificationsFromServer(): void {
    this.http.get<Notification[]>(this.API_URL, {
      headers: this.getAuthHeaders(),
    }).subscribe({
      next: (data) => this.notificationsSubject.next(data),
      error: (err) => console.error('Error fetching notifications:', err),
    });
  }

  requestNotificationPermission(): void {
    if ('Notification' in window) {
      window.Notification.requestPermission();
    }
  }

  private showBrowserNotification(title: string, message: string): void {
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(title, { body: message });
    }
  }

  addNotification(notification: Notification): void {
    const updated = [notification, ...this.notificationsSubject.value];
    this.notificationsSubject.next(updated);
  }

  markAsRead(notificationId: string) {
  return this.http.post<Notification>(  
    `${this.API_URL}/${notificationId}`,
    { seen: true },
    { headers: this.getAuthHeaders() }
  );
}


  markAllAsRead() {
    return this.http.put(`${this.API_URL}/markAllRead`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteNotification(notificationId: string) {
    return this.http.delete(`${this.API_URL}/${notificationId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  clearAllNotifications() {
    return this.http.delete(`${this.API_URL}/clearAll`, {
      headers: this.getAuthHeaders(),
    });
  }

  sendTestNotification() {
    return this.http.post<Notification>(`${this.API_URL}/test`, {}, {
      headers: this.getAuthHeaders(),
    });
  }
}
