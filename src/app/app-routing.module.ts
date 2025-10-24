import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardAdminComponent } from './components/dashboard-admin/dashboard-admin.component';
import { AdministrationComponent } from './components/administration/administration.component';
import { DepartmentCriteriaManagementComponent } from './components/department-criteria-management/department-criteria-management.component';
// import { AuthGuard } from './guards/auth.guard';
// import { LoginGuard } from './guards/login.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // صفحة تسجيل الدخول - محمية بـ LoginGuard لمنع الوصول بعد تسجيل الدخول
  { path: 'login', component: LoginComponent},

  // الصفحات الداخلية المحمية
  {
    path: 'administration',
    component: AdministrationComponent,
  },
  {
    path: 'dashboard-admin',
    component: DashboardAdminComponent,
  },
  {
    path: 'criteria-management',
    component: DepartmentCriteriaManagementComponent,
  },
  // أي مسار غير معروف يعيد إلى login
  { path: '**', redirectTo: 'login' },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
