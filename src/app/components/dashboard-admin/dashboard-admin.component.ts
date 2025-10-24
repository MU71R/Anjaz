import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../../service/login.service';

interface Achievement {
  id: number;
  userId: number;
  userName: string;
  department: string;
  title: string;
  description: string;
  mainCriterion: string;
  subCriterion: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  createdAt: string;
}

interface User {
  id: number;
  fullName: string;
  role: 'admin' | 'user';
}


@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
})
export class DashboardAdminComponent {
  currentUser: User = { id: 1, fullName: 'محمد أحمد', role: 'admin' };

  achievements: Achievement[] = [];
  filteredAchievements: Achievement[] = [];

  searchQuery = '';
  statusFilter = 'all';
  departmentFilter = 'all';

  departments: string[] = [];

  stats: Record<'all' | 'total' | 'pending' | 'approved' | 'rejected', number> =
    {
      all: 0,
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    

  ngOnInit() {
    // بيانات تجريبية
    this.achievements = [
      {
        id: 1,
        userId: 1,
        userName: 'أحمد علي',
        department: 'تقنية المعلومات',
        title: 'إنجاز 1',
        description: 'وصف 1',
        mainCriterion: 'المعيار الرئيسي 1',
        subCriterion: 'المعيار الفرعي 1',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        userId: 2,
        userName: 'منى خالد',
        department: 'الموارد البشرية',
        title: 'إنجاز 2',
        description: 'وصف 2',
        mainCriterion: 'المعيار الرئيسي 2',
        subCriterion: 'المعيار الفرعي 2',
        status: 'approved',
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        userId: 1,
        userName: 'أحمد علي',
        department: 'تقنية المعلومات',
        title: 'إنجاز 3',
        description: 'وصف 3',
        mainCriterion: 'المعيار الرئيسي 3',
        subCriterion: 'المعيار الفرعي 3',
        status: 'rejected',
        createdAt: new Date().toISOString(),
      },
    ];

    this.departments = Array.from(
      new Set(this.achievements.map((a) => a.department))
    );

    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.achievements;

    // تصفية حسب المستخدم
    if (this.currentUser.role === 'user') {
      filtered = filtered.filter(
        (a) => a.userId === this.currentUser.id && a.status !== 'draft'
      );
    } else {
      filtered = filtered.filter((a) => a.status !== 'draft');
    }

    // البحث
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.userName.toLowerCase().includes(q)
      );
    }

    // تصفية الحالة
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === this.statusFilter);
    }

    // تصفية القسم
    if (this.departmentFilter !== 'all') {
      filtered = filtered.filter((a) => a.department === this.departmentFilter);
    }

    this.filteredAchievements = filtered;

    this.updateStats();
  }

  updateStats() {
    const data =
      this.currentUser.role === 'admin'
        ? this.achievements.filter((a) => a.status !== 'draft')
        : this.achievements.filter(
            (a) => a.userId === this.currentUser.id && a.status !== 'draft'
          );

    this.stats.total = data.length;
    this.stats.pending = data.filter((a) => a.status === 'pending').length;
    this.stats.approved = data.filter((a) => a.status === 'approved').length;
    this.stats.rejected = data.filter((a) => a.status === 'rejected').length;
  }

  getStatValue(): number {
    return this.stats[this.statusFilter as keyof typeof this.stats];
  }

  resetFilters() {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.departmentFilter = 'all';
    this.applyFilters();
  }

  getStatusLabel(status: Achievement['status']): any {
    switch (status) {
      case 'pending':
        return 'قيد المراجعة';
      case 'approved':
        return 'معتمد';
      case 'rejected':
        return 'مرفوض';
      case 'draft':
        return 'مسودة';
      default:
        return '';
    }
  }

  getStatusClass(status: Achievement['status']): any {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'approved':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      case 'draft':
        return 'badge-secondary';
      default:
        return '';
    }
  }
}
