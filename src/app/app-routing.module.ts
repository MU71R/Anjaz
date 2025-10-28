import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardAdminComponent } from './components/dashboard-admin/dashboard-admin.component';
import { AdministrationComponent } from './components/administration/administration.component';
import { DepartmentCriteriaManagementComponent } from './components/department-criteria-management/department-criteria-management.component';
import { AddAchievementComponent } from './components/add-achievement/add-achievement.component';
import { MyAchievementsComponent } from './components/my-achievements/my-achievements.component';
import { DraftsComponent } from './components/draft/draft.component';
import { ArchivedActivitiesComponent } from './components/archives/archives.component';
// import { AuthGuard } from './guards/auth.guard';
// import { LoginGuard } from './guards/login.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // صفحة تسجيل الدخول - محمية بـ LoginGuard لمنع الوصول بعد تسجيل الدخول
  { path: 'login', component: LoginComponent },

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
  {
    path: 'add-achievement',
    component: AddAchievementComponent,
  },
  {
    path: 'my-achievements',
    component: MyAchievementsComponent,
  },
  { path: 'drafts', component: DraftsComponent }, // المسودة
  { path: 'archive', component: ArchivedActivitiesComponent },
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
