import { Component, OnInit } from '@angular/core';

interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  user: string;
  college: string;
  category: string;
  attachmentsCount: number;
  date: string;
  status: 'قيد المراجعة' | 'معتمد' | 'مرفوض';
  rejectionNotes?: string;
}

@Component({
  selector: 'app-my-achievements',
  templateUrl: './my-achievements.component.html',
  styleUrls: ['./my-achievements.component.css']
})
export class MyAchievementsComponent implements OnInit {
  searchTerm: string = '';
  statusFilter: string = 'all';
  achievements: Achievement[] = [];
  selectedAchievement: Achievement | null = null;
  rejectionReason: string = '';

  // 🟢 التحكم بالمودالات
  showDetailsModal = false;
  showRejectModal = false;

  ngOnInit(): void {
    this.achievements = this.getMockData();
  }

  // بيانات تجريبية
  getMockData(): Achievement[] {
    return [
      {
        id: '1',
        userId: '1',
        title: 'نشر بحث علمي في مجلة دولية محكمة',
        description: 'تم نشر بحث علمي متميز في مجال التعليم الإلكتروني.',
        user: 'فاطمة خالد السالم',
        college: 'قطاع التعليم',
        category: 'البحث العلمي',
        attachmentsCount: 1,
        date: '١٤٤٧/٠٩/٠٩',
        status: 'قيد المراجعة'
      },
      {
        id: '2',
        userId: '2',
        title: 'تطوير تطبيق تعليمي ذكي',
        description: 'تطوير تطبيق يستخدم الذكاء الاصطناعي لتحسين تجربة التعلم.',
        user: 'سارة القحطاني',
        college: 'قطاع الهندسة',
        category: 'الابتكار',
        attachmentsCount: 2,
        date: '١٤٤٧/٠٥/٢٢',
        status: 'معتمد'
      },
      {
        id: '3',
        userId: '3',
        title: 'الحصول على براءة اختراع',
        description: 'براءة اختراع في مجال الطاقة المتجددة.',
        user: 'علي الدوسري',
        college: 'قطاع العلوم',
        category: 'الاختراع',
        attachmentsCount: 3,
        date: '١٤٤٦/٠٨/١٥',
        status: 'مرفوض',
        rejectionNotes: 'الوثائق غير مكتملة وغير مصدقة.'
      }
    ];
  }

  filteredAchievements(): Achievement[] {
    let list = [...this.achievements];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term) ||
        a.user.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter !== 'all') {
      list = list.filter(a => a.status === this.statusFilter);
    }

    return list;
  }

  resetFilters() {
    this.searchTerm = '';
    this.statusFilter = 'all';
  }

  // 🔍 عرض التفاصيل
  openDetailsModal(achievement: Achievement) {
    this.selectedAchievement = achievement;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedAchievement = null;
  }

  // ❌ رفض الإنجاز
  openRejectModal(achievement: Achievement) {
    this.selectedAchievement = achievement;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal() {
    this.showRejectModal = false;
  }

  submitRejection() {
    if (!this.selectedAchievement) return;

    this.achievements = this.achievements.map(a =>
      a.id === this.selectedAchievement!.id
        ? { ...a, status: 'مرفوض', rejectionNotes: this.rejectionReason }
        : a
    );

    this.showRejectModal = false;
    this.showDetailsModal = false;
  }

  // 🟢 اعتماد / حذف / إعادة تعيين
  handleAction(action: string, id: string) {
    if (action === 'approve') {
      this.updateStatus(id, 'معتمد');
      this.showDetailsModal = false;
    } else if (action === 'delete') {
      this.achievements = this.achievements.filter(a => a.id !== id);
    } else if (action === 'reassign') {
      this.updateStatus(id, 'قيد المراجعة');
    }
  }

  updateStatus(id: string, status: 'معتمد' | 'قيد المراجعة' | 'مرفوض') {
    this.achievements = this.achievements.map(a =>
      a.id === id ? { ...a, status } : a
    );
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'معتمد':
        return 'bg-success text-white';
      case 'قيد المراجعة':
        return 'bg-warning text-dark';
      case 'مرفوض':
        return 'bg-danger text-white';
      default:
        return '';
    }
  }
}
