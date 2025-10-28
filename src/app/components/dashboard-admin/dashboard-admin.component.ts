import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../../service/achievements-service.service';
import { Activity } from 'src/app/model/achievement';
import Swal from 'sweetalert2';

interface User {
  id: string;
  fullName: string;
  role: 'admin' | 'user';
}

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
})
export class DashboardAdminComponent implements OnInit {
  currentUser: User = {
    id: localStorage.getItem('userId') || '',
    fullName: localStorage.getItem('fullname') || '',
    role: (localStorage.getItem('role') as 'admin' | 'user') || 'user',
  };

  activities: Activity[] = [];
  filteredActivities: Activity[] = [];

  searchQuery = '';
  statusFilter = 'all';
  departmentFilter = 'all';
  departments: string[] = [];

  stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  constructor(private activityService: ActivityService) {}

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.activityService.getAll().subscribe({
      next: (res) => {
        this.activities = res.activities.filter(
          (a) => a.SaveStatus !== 'مسودة'
        );
        this.departments = Array.from(
          new Set(
            this.activities
              .map((a) => (a as any).department || a.name || '')
              .filter((d) => d)
          )
        );
        this.applyFilters();
      },
      error: (err) => {
        Swal.fire('خطأ', err.error?.message || 'فشل تحميل الأنشطة', 'error');
      },
    });
  }

  applyFilters(): void {
    let filtered = this.activities;

    // تصفية حسب المستخدم (لو مستخدم عادي)
    if (this.currentUser.role === 'user') {
      filtered = filtered.filter(
        (a) => a.user === this.currentUser.id && a.SaveStatus !== 'مسودة'
      );
    }

    // البحث
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.activityTitle?.toLowerCase().includes(q) ||
          a.activityDescription?.toLowerCase().includes(q) ||
          (a.name?.toLowerCase().includes(q) ?? false)
      );
    }

    // الحالة
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(
        (a) => a.status === this.getArabicStatus(this.statusFilter)
      );
    }

    // القسم (إن وجد)
    if (this.departmentFilter !== 'all') {
      filtered = filtered.filter(
        (a) => (a as any).department === this.departmentFilter
      );
    }

    this.filteredActivities = filtered;
    this.updateStats();
  }

  getArabicStatus(status: string): string {
    switch (status) {
      case 'pending':
        return 'قيد المراجعة';
      case 'approved':
        return 'معتمد';
      case 'rejected':
        return 'مرفوض';
      default:
        return status;
    }
  }

  updateStats(): void {
    const data = this.activities.filter((a) => a.SaveStatus !== 'مسودة');
    this.stats.total = data.length;
    this.stats.pending = data.filter((a) => a.status === 'قيد المراجعة').length;
    this.stats.approved = data.filter((a) => a.status === 'معتمد').length;
    this.stats.rejected = data.filter((a) => a.status === 'مرفوض').length;
  }

  getStatValue(stat: keyof typeof this.stats): number {
    return this.stats[stat];
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.departmentFilter = 'all';
    this.applyFilters();
  }

  getStatusLabel(status: Activity['status']): string {
    return status;
  }

  getStatusClass(status: Activity['status']): string {
    switch (status) {
      case 'قيد المراجعة':
        return 'badge-warning';
      case 'معتمد':
        return 'badge-success';
      case 'مرفوض':
        return 'badge-danger';
      case 'مسودة':
        return 'badge-secondary';
      default:
        return '';
    }
  }
}
