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
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';


const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },

  {
    path: 'administration',
    component: AdministrationComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard',
    component: DashboardAdminComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'criteria-management',
    component: DepartmentCriteriaManagementComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-achievement',
    component: AddAchievementComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'my-achievements',
    component: MyAchievementsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'edit-achievement/:id',
    component: AddAchievementComponent,
    canActivate: [AuthGuard],
  },
  { path: 'drafts', component: DraftsComponent, canActivate: [AuthGuard] },
  {
    path: 'archive',
    component: ArchivedActivitiesComponent,
    canActivate: [AuthGuard],
  },

  { path: '**', redirectTo: 'login' },
];


@NgModule({
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
