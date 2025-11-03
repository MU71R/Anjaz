import { Component, OnInit } from '@angular/core';
import { AdministrationService } from '../../service/user.service';
import { User, Sector } from '../../model/user';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.css'],
})
export class AdministrationComponent implements OnInit {
  users: User[] = [];
  sectors: Sector[] = [];
  filteredList: User[] = [];
  activeTab: 'users' | 'sectors' = 'users';

  searchTerm = '';
  selectedSector = '';
  showAddDepartmentModal = false;
  showEditUserModal = false;
  showSectorForm = false;
  showPassword = false;
  newDepartment: Partial<User> & { _id?: string } = {
    fullname: '',
    username: '',
    password: '',
    role: 'user',
    sector: '',
  };

  selectedUser: Partial<User> & { _id?: string } = {};
  newSector: Sector = { _id: '', sector: '' };

  constructor(private adminService: AdministrationService) {}

  ngOnInit(): void {
    this.loadSectors();
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        const usersArray = Array.isArray(data)
          ? data
          : (data as { data: User[] }).data;
        this.users = (usersArray || [])
          .filter((u) => u.username && u.fullname)
          .map((u) => {
            let sectorId = '';
            let sectorName = '---';
            if (typeof u.sector === 'string') {
              sectorId = u.sector;
              const found = this.sectors.find((s) => s._id === sectorId);
              if (found) sectorName = found.sector;
            } else if (u.sector && typeof u.sector === 'object') {
              const sec = u.sector as Sector;
              sectorId = sec._id || '';
              sectorName = sec.sector || '---';
            }
            return {
              _id: u._id,
              fullname: u.fullname,
              username: u.username,
              role: u.role,
              sector: sectorId,
              sectorName,
              status: u.status,
            };
          });
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) =>
        console.error('خطأ في جلب المستخدمين:', err.message),
    });
  }

  toggleStatus(user: User): void {
    if (!user._id) return;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    this.adminService.updateUserStatus(user._id, newStatus).subscribe({
      next: () => (user.status = newStatus),
      error: (err: HttpErrorResponse) => {
        const errorMessage = err.error?.message || err.message;
        Swal.fire({
          icon: 'error',
          title: 'خطأ في تحديث الحالة',
          text: errorMessage,
        });
      },
    });
  }

  openAddDepartment(): void {
    this.newDepartment = {
      fullname: '',
      username: '',
      password: '',
      role: 'user',
      sector: '',
    };
    this.showAddDepartmentModal = true;
  }

  closeAddDepartment(): void {
    this.showAddDepartmentModal = false;
  }

  openEditUser(user: User): void {
    this.selectedUser = { ...user };
    this.showEditUserModal = true;
  }

  closeEditUser(): void {
    this.selectedUser = {};
    this.showEditUserModal = false;
  }

  confirmEditUser(): void {
    if (!this.selectedUser._id) return;
    const { fullname, username, role, sector } = this.selectedUser;
    if (!fullname?.trim() || !username?.trim() || !role || !sector) {
      Swal.fire({
        icon: 'warning',
        title: 'املأ جميع الحقول المطلوبة قبل الحفظ',
      });
      return;
    }
    const payload: Partial<User> = {
      fullname: fullname.trim(),
      username: username.trim(),
      role,
      status: this.selectedUser.status,
      sector: typeof sector === 'string' ? sector : (sector as Sector)?._id,
    };
    this.adminService.updateUser(this.selectedUser._id, payload).subscribe({
      next: (response: any) => {
        if (response.success) {
          const index = this.users.findIndex(
            (u) => u._id === this.selectedUser._id
          );
          if (index !== -1)
            this.users[index] = { ...this.users[index], ...payload };
          this.applyFilters();
          Swal.fire({
            icon: 'success',
            title: response.message || 'تم تعديل المستخدم بنجاح',
            timer: 2000,
            showConfirmButton: false,
          });
          this.closeEditUser();
        } else {
          Swal.fire({
            icon: 'error',
            title: response.message || 'خطأ أثناء تعديل المستخدم',
          });
        }
      },
      error: (err: HttpErrorResponse) => {
        const errorMessage = err.error?.message || err.message;
        Swal.fire({
          icon: 'error',
          title: 'خطأ أثناء تعديل المستخدم',
          text: errorMessage,
        });
      },
    });
  }

  deleteUser(user: User): void {
    if (!user._id) return;
    Swal.fire({
      title: `هل أنت متأكد من حذف المستخدم ${user.fullname}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.adminService.deleteUser(user._id!).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.users = this.users.filter((u) => u._id !== user._id);
            this.applyFilters();
            Swal.fire({
              icon: 'success',
              title: response.message || 'تم حذف المستخدم',
              timer: 2000,
              showConfirmButton: false,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: response.message || 'خطأ أثناء الحذف',
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          const errorMessage = err.error?.message || err.message;
          Swal.fire({
            icon: 'error',
            title: 'خطأ أثناء الحذف',
            text: errorMessage,
          });
        },
      });
    });
  }

  applyFilters(): void {
    this.filteredList = this.users.filter((user) => {
      const matchSector = this.selectedSector
        ? user.sector === this.selectedSector
        : true;
      const matchName = this.searchTerm
        ? user.fullname?.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;
      return matchSector && matchName;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedSector = '';
    this.applyFilters();
  }

  loadSectors(): void {
    this.adminService.getAllSectors().subscribe({
      next: (res) => {
        const sectorsData = (res as any).data || res;
        this.sectors = (sectorsData || [])
          .filter((s: Sector) => s.sector)
          .map((s: Sector) => ({ _id: s._id, sector: s.sector }));
      },
      error: (err: HttpErrorResponse) => {
        const errorMessage = err.error?.message || err.message;
        Swal.fire({
          icon: 'error',
          title: 'خطأ في جلب القطاعات',
          text: errorMessage,
        });
      },
    });
  }

  openSectorForm(): void {
    this.newSector = { _id: '', sector: '' };
    this.showSectorForm = true;
  }

  editSector(sector: Sector): void {
    this.newSector = { ...sector };
    this.showSectorForm = true;
  }

  closeSectorForm(): void {
    this.showSectorForm = false;
    this.newSector = { _id: '', sector: '' };
  }

  saveSector(): void {
    if (!this.newSector.sector?.trim()) {
      Swal.fire({ icon: 'warning', title: 'اسم القطاع مطلوب' });
      return;
    }
    const payload = { sector: this.newSector.sector.trim() };
    if (this.newSector._id) {
      this.adminService.updateSector(this.newSector._id, payload).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.closeSectorForm();
            this.loadSectors();
            this.loadUsers();
            Swal.fire({
              icon: 'success',
              title: response.message || 'تم تعديل القطاع بنجاح',
              timer: 2000,
              showConfirmButton: false,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: response.message || 'خطأ في تعديل القطاع',
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          const errorMessage = err.error?.message || err.message;
          Swal.fire({
            icon: 'error',
            title: 'خطأ في تعديل القطاع',
            text: errorMessage,
          });
        },
      });
    } else {
      this.adminService.addSector(payload as Sector).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.closeSectorForm();
            this.loadSectors();
            Swal.fire({
              icon: 'success',
              title: response.message || 'تم إضافة القطاع بنجاح',
              timer: 2000,
              showConfirmButton: false,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: response.message || 'خطأ أثناء إضافة القطاع',
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          const errorMessage = err.error?.message || err.message;
          Swal.fire({
            icon: 'error',
            title: 'خطأ أثناء إضافة القطاع',
            text: errorMessage,
          });
        },
      });
    }
  }

  deleteSector(id?: string): void {
    if (!id) return;
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من التراجع بعد الحذف!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.adminService.deleteSector(id).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadSectors();
            this.loadUsers();
            Swal.fire({
              icon: 'success',
              title: response.message || 'تم حذف القطاع بنجاح',
              timer: 2000,
              showConfirmButton: false,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: response.message || 'خطأ في الحذف',
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          const errorMessage = err.error?.message || err.message;
          Swal.fire({
            icon: 'error',
            title: 'خطأ في الحذف',
            text: errorMessage,
          });
        },
      });
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  saveDepartment(): void {
    const { fullname, username, password, role, sector } = this.newDepartment;
    if (!fullname?.trim()) {
      Swal.fire({ icon: 'warning', title: 'الاسم الكامل مطلوب' });
      return;
    }
    if (!username?.trim()) {
      Swal.fire({ icon: 'warning', title: 'اسم المستخدم مطلوب' });
      return;
    }
    if (!password) {
      Swal.fire({ icon: 'warning', title: 'كلمة المرور مطلوبة' });
      return;
    }
    if (!role) {
      Swal.fire({ icon: 'warning', title: 'اختر الدور' });
      return;
    }
    if (!sector) {
      Swal.fire({ icon: 'warning', title: 'اختر القطاع' });
      return;
    }

    this.adminService
      .addUser({ ...this.newDepartment, sector } as User)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            Swal.fire({
              icon: 'success',
              title: response.message || 'تمت الإضافة بنجاح',
              timer: 2000,
              showConfirmButton: false,
            });
            this.closeAddDepartment();
            this.loadUsers();
          } else {
            Swal.fire({
              icon: 'error',
              title: response.message || 'خطأ أثناء الإضافة',
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          const errorMessage = err.error?.message || err.message;
          Swal.fire({
            icon: 'error',
            title: 'خطأ أثناء الإضافة',
            text: errorMessage,
          });
        },
      });
  }
}
