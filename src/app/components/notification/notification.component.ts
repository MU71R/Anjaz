import { Component, OnInit } from '@angular/core';
import { NotificationService } from 'src/app/service/notification.service';
import { Notification } from 'src/app/model/notification';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {

  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  notificationTypes: string[] = ['info', 'success', 'warning', 'error'];
  isLoading = false;
  showNotificationsModal = false;
  activeFilter: string = 'all';
  unreadCount = 0;
  hasMoreNotifications = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.notifications$.subscribe({
      next: (data) => {
        this.notifications = data;
        this.updateFilteredNotifications();
        this.updateUnreadCount();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('خطأ أثناء تحميل الإشعارات:', err);
        this.isLoading = false;
      }
    });
  }

  updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  openNotificationsModal(): void {
    this.showNotificationsModal = true;
  }

  closeNotificationsModal(): void {
    this.showNotificationsModal = false;
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.updateFilteredNotifications();
  }

  updateFilteredNotifications(): void {
    if (this.activeFilter === 'all') {
      this.filteredNotifications = this.notifications;
    } else if (this.activeFilter === 'unread') {
      this.filteredNotifications = this.notifications.filter(n => !n.read);
    } else {
      this.filteredNotifications = this.notifications.filter(n => n.type === this.activeFilter);
    }
  }

  markAsRead(_id: string): void {
  this.notificationService.markAsRead(_id).subscribe({
    next: (updatedNotif: Notification) => {
      const index = this.notifications.findIndex(n => n._id === _id);
      if (index !== -1) {
        this.notifications[index] = updatedNotif; 
      }
      this.updateUnreadCount();
      this.updateFilteredNotifications();
      Swal.fire('تم تعليم الإشعار كمقروء بنجاح', '', 'success');
    },
    error: err => console.error('خطأ أثناء التعليم كمقروء:', err)
  });
}

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
        this.updateUnreadCount();
        this.updateFilteredNotifications();
        Swal.fire('تم تعليم الكل كمقروء بنجاح', '', 'success');
      },
      error: err => console.error('خطأ أثناء تعليم الكل كمقروء:', err)
    });
  }

  sendTestNotification(): void {
    this.notificationService.sendTestNotification().subscribe({
      next: (newNotif) => {
        this.notifications.unshift(newNotif);
        this.updateUnreadCount();
        this.updateFilteredNotifications();
      },
      error: err => console.error('خطأ أثناء إنشاء إشعار تجريبي:', err)
    });
  }

  removeNotification(_id: string): void {
    this.notificationService.deleteNotification(_id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n._id !== _id);
        this.updateUnreadCount();
        this.updateFilteredNotifications();
        Swal.fire('تم حذف الإشعار بنجاح', '', 'success');
      },
      error: err => console.error('خطأ أثناء حذف الإشعار:', err)
    });
  }

  clearAllNotifications(): void {
    if (!confirm('هل أنت متأكد من مسح جميع الإشعارات؟')) return;
    this.notificationService.clearAllNotifications().subscribe({
      next: () => {
        this.notifications = [];
        this.updateFilteredNotifications();
        this.updateUnreadCount();
        Swal.fire('تم مسح جميع الإشعارات بنجاح', '', 'success');
      },
      error: err => console.error('خطأ أثناء مسح الإشعارات:', err)
    });
  }

  hasUnreadNotifications(): boolean {
    return this.notifications.some(n => !n.read);
  }

  isRead(notification: Notification): boolean {
    return !!notification.read;
  }

  getTypeLabel(type: string): string {
    const map: any = {
      info: 'معلومة',
      warning: 'تحذير',
      success: 'نجاح',
      error: 'خطأ'
    };
    return map[type] || 'أخرى';
  }

  getNotificationIcon(type: string): string {
    const icons: any = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌'
    };
    return icons[type] || '🔔';
  }

  formatTimeAgo(timestamp?: string): string {
    if (!timestamp) return '';
    const now = new Date().getTime();
    const time = new Date(timestamp).getTime();
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return 'الآن';
    if (diff < 3600) return `${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
    return `${Math.floor(diff / 86400)} يوم`;
  }

  getTypeCount(type: string): number {
    return this.notifications.filter(n => n.type === type).length;
  }

  loadMoreNotifications(): void {
    this.hasMoreNotifications = false;
  }
}
