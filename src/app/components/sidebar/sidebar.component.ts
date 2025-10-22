import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../../service/login.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  constructor(private router: Router, private loginService: LoginService) {}

  isSidebarOpen = false;
  
  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}
