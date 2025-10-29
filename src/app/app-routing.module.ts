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


const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

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
  {
    path: 'edit-achievement/:id',
    component: AddAchievementComponent,
  },
  { path: 'drafts', component: DraftsComponent }, 
  { path: 'archive', component: ArchivedActivitiesComponent },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
