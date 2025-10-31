import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Notification } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {}

  // إضافة دوال جديدة
  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value.map((notification) =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    this.notificationsSubject.next(notifications);
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(
      (notification) => ({ ...notification, read: true })
    );
    this.notificationsSubject.next(notifications);
  }

  // الدوال الحالية مع تحديثات
  removeNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value.filter(
      (notification) => notification.id !== notificationId
    );
    this.notificationsSubject.next(notifications);
  }

  clearNotifications(): void {
    this.notificationsSubject.next([]);
  }

  addNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
  }

  sendTestNotification(): void {
    // إنشاء ID فريد للإشعار
    const notificationId = this.generateUniqueId();

    const testNotification: Notification = {
      id: notificationId,
      title: 'إشعار تجريبي',
      message: 'هذا إشعار تجريبي للاختبار',
      type: 'info',
      timestamp: new Date(),
      read: false,
    };

    this.addNotification(testNotification);
  }

  // دالة مساعدة لإنشاء ID فريد
  private generateUniqueId(): string {
    return (
      'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    );
  }

  requestNotificationPermission(): void {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }

  // دالة مساعدة للحصول على الإشعارات غير المقروءة
  getUnreadNotifications(): Notification[] {
    return this.notificationsSubject.value.filter(
      (notification) => !notification.read
    );
  }

  // دالة مساعدة للحصول على عدد الإشعارات غير المقروءة
  getUnreadCount(): number {
    return this.getUnreadNotifications().length;
  }

  // دالة لإضافة إشعارات من الخادم (إذا كنت تتصل بخادم)
  addNotificationsFromServer(notifications: Notification[]): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [...notifications, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
  }
}
