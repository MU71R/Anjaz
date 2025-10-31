import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { NotificationService } from '../../service/notification.service';
import { Notification } from '../../service/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css'],
  animations: [
    trigger('modalAnimation', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.8) translateY(-20px)',
        })
      ),
      state(
        '*',
        style({
          opacity: 1,
          transform: 'scale(1) translateY(0)',
        })
      ),
      transition('void <=> *', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')),
    ]),
  ],
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  showNotificationsModal = false;
  activeFilter = 'all';
  isLoading = false;
  hasMoreNotifications = false;
  private subscription?: Subscription;

  // إحصائيات الإشعارات
  unreadCount = 0;
  notificationTypes = ['success', 'warning', 'error', 'info'];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(
      (notifications) => {
        this.notifications = notifications;
        this.updateUnreadCount();
        this.applyFilter();
      }
    );

    this.notificationService.requestNotificationPermission();
  }

  // فتح المودال
  openNotificationsModal(): void {
    this.showNotificationsModal = true;
    this.markAllAsRead(); // تعليم الكل كمقروء عند فتح المودال
    document.body.style.overflow = 'hidden';
  }

  // إغلاق المودال
  closeNotificationsModal(): void {
    this.showNotificationsModal = false;
    document.body.style.overflow = '';
  }

  // تطبيق الفلتر
  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.activeFilter === 'all') {
      this.filteredNotifications = this.notifications;
    } else if (this.activeFilter === 'unread') {
      this.filteredNotifications = this.notifications.filter(
        (n) => !this.isRead(n)
      );
    } else {
      this.filteredNotifications = this.notifications.filter(
        (n) => n.type === this.activeFilter
      );
    }
  }

  // التحقق من حالة القراءة بشكل آمن
  isRead(notification: Notification): boolean {
    return notification.read === true;
  }

  // تحديث عدد الإشعارات غير المقروءة
  updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter((n) => !this.isRead(n)).length;
  }

  // التحقق من وجود إشعارات غير مقروءة
  hasUnreadNotifications(): boolean {
    return this.unreadCount > 0;
  }

  // الحصول على عدد الإشعارات حسب النوع
  getTypeCount(type: string): number {
    return this.notifications.filter((n) => n.type === type).length;
  }

  // الحصول على تسمية النوع
  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      success: 'نجاح',
      warning: 'تحذير',
      error: 'خطأ',
      info: 'معلومات',
    };
    return labels[type] || type;
  }

  // تعليم إشعار كمقروء
  markAsRead(notificationId: string | undefined): void {
    if (notificationId) {
      this.notificationService.markAsRead(notificationId);
    }
  }

  // تعليم الكل كمقروء
  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  // إزالة إشعار
  removeNotification(notificationId: string | undefined): void {
    if (notificationId) {
      this.notificationService.removeNotification(notificationId);
    }
  }

  // مسح جميع الإشعارات
  clearAllNotifications(): void {
    if (confirm('هل أنت متأكد من رغبتك في مسح جميع الإشعارات؟')) {
      this.notificationService.clearNotifications();
    }
  }

  // إرسال إشعار تجريبي
  sendTestNotification(): void {
    this.notificationService.sendTestNotification();
  }

  // الحصول على أيقونة النوع
  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ℹ',
    };
    return icons[type] || '🔔';
  }

  // تنسيق الوقت
  formatTimeAgo(timestamp: any): string {
    if (!timestamp) return 'غير محدد';

    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

    // التحقق من أن التاريخ صالح
    if (isNaN(date.getTime())) {
      return 'تاريخ غير صالح';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;

    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // تحميل المزيد من الإشعارات
  loadMoreNotifications(): void {
    this.isLoading = true;
    // محاكاة تحميل البيانات
    setTimeout(() => {
      this.isLoading = false;
      // في التطبيق الحقيقي، هنا ستقوم بجلب المزيد من البيانات من الخادم
    }, 1000);
  }

  // إغلاق المودال بالضغط على Escape
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKeydown(event: KeyboardEvent): void {
    if (this.showNotificationsModal) {
      this.closeNotificationsModal();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    document.body.style.overflow = '';
  }
}
