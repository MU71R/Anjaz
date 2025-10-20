import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
})
export class DashboardAdminComponent {
  constructor(private router: Router) {}

  stats = [
    {
      label: 'جميع الإنجازات',
      value: 6,
      icon: 'fa-solid fa-clipboard',
      colorClass: 'stat-all',
    },
    {
      label: 'المعتمدة',
      value: 3,
      icon: 'fa-solid fa-check-circle',
      colorClass: 'stat-approved',
    },
    {
      label: 'في انتظار الموافقة',
      value: 2,
      icon: 'fa-regular fa-clock',
      colorClass: 'stat-pending',
    },
    {
      label: 'المرفوضة',
      value: 1,
      icon: 'fa-solid fa-circle-xmark',
      colorClass: 'stat-rejected',
    },
  ];

  achievements = [
    {
      title: 'نشر بحث علمي في مجلة دولية محكمة',
      author: 'فاطمة خالد السالم',
      department: 'كلية التربية',
      date: '٩‏/٤‏/١٤٤٧ هـ',
      categoryMain: 'البحث العلمي',
      categorySub: 'الأبحاث المنشورة',
      statusText: 'معتمد',
      statusClass: 'status-approved',
    },
    {
      title: 'تطوير تطبيق تعليمي ذكي',
      author: 'سارة أحمد القحطاني',
      department: 'كلية الهندسة',
      date: '١٨‏/٤‏/١٤٤٧ هـ',
      categoryMain: 'الابتكار والتطوير',
      categorySub: 'التطبيقات التعليمية',
      statusText: 'قيد المراجعة',
      statusClass: 'status-pending',
    },
    {
      title: 'إجراء عملية جراحية نادرة بنجاح',
      author: 'محمد عبدالله الزهراني',
      department: 'كلية الطب',
      date: '٢٣‏/٣‏/١٤٤٧ هـ',
      categoryMain: 'التميز الأكاديمي',
      categorySub: 'التميز في التدريس',
      statusText: 'معتمد',
      statusClass: 'status-approved',
    },
    {
      title: 'تنظيم مؤتمر علمي دولي',
      author: 'أحمد محمد العلي',
      department: 'العلاقات العامة',
      date: '٧‏/٢‏/١٤٤٧ هـ',
      categoryMain: 'البحث العلمي',
      categorySub: 'المؤتمرات العلمية',
      statusText: 'معتمد',
      statusClass: 'status-approved',
    },
    {
      title: 'برنامج تدريبي للمجتمع المحلي',
      author: 'فاطمة خالد السالم',
      department: 'كلية إدارة الأعمال',
      date: '٢٠‏/٤‏/١٤٤٧ هـ',
      categoryMain: 'خدمة المجتمع',
      categorySub: 'الدورات التدريبية',
      statusText: 'قيد المراجعة',
      statusClass: 'status-pending',
    },
    {
      title: 'حصول الكلية على الاعتماد الأكاديمي الدولي',
      author: 'سارة أحمد القحطاني',
      department: 'كلية الهندسة',
      date: '28/3/1447',
      categoryMain: 'الجودة والاعتماد الأكاديمي',
      categorySub: 'الاعتماد المؤسسي',
      statusText: 'مرفوض',
      statusClass: 'status-rejected',
    },
  ];

}
