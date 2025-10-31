import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../../service/login.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  isSidebarOpen = false;
  userRole: string | null = null;
  userName: string | null = null;

  private menuPermissions: { [key: string]: string[] } = {
    dashboard: ['admin', 'user'],
    'add-achievement': ['admin', 'user'],
    'my-achievements': ['admin', 'user'],
    administration: ['admin'],
    'criteria-management': ['admin'],
    archive: ['admin'],
    drafts: ['admin', 'user'],
    reports: ['admin', 'user'],
    statistics: ['admin'],
  };

  constructor(private router: Router, private loginService: LoginService) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadUserData();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (window.innerWidth >= 992) {
      this.isSidebarOpen = false;
    }
  }

  private loadUserData(): void {
    this.userRole = this.loginService.getUserRole();
    const currentUser = this.loginService.getCurrentUser();
    this.userName = currentUser?.fullname || currentUser?.username || 'مستخدم';
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  canShowItem(menuKey: string): boolean {
    const allowedRoles = this.menuPermissions[menuKey];
    return allowedRoles ? allowedRoles.includes(this.userRole!) : false;
  }

  isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  getRoleDisplayName(): string {
    const roleNames: { [key: string]: string } = {
      admin: 'مدير النظام',
      user: 'مستخدم',
    };
    return this.userRole ? roleNames[this.userRole] || this.userRole : 'زائر';
  }

  getRoleBadgeClass(): string {
    return this.isAdmin() ? 'badge bg-danger' : 'badge bg-primary';
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}
