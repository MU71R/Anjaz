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
  activeTab: 'users' | 'sectors' | 'departments' = 'users';
  searchTerm = '';
  selectedSector = '';
  showPassword: boolean = false;
  newSector: Sector = { sector: '' };
  showSectorForm = false;
  selectedUser: Partial<User> = {
    _id: '',
    username: '',
    fullname: '',
    password: '',
    role: 'user',
    sector: '',
    status: 'active',
  };
  newDepartment = {
    _id: '',
    fullname: '',
    username: '',
    password: '',
    role: '',
    sector: '',
  };
  showDepartmentForm = false;

  constructor(private adminService: AdministrationService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadSectors();
  }

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data
          .filter((u) => u.username && u.fullname)
          .map((u) => ({
            _id: u._id,
            fullname: u.fullname || '---',
            username: u.username || '---',
            role: u.role || 'user',
            sector: u.sector || '---',
            status: u.status || 'inactive',
          }));
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) =>
        console.error('خطأ في جلب المستخدمين:', err.message),
    });
  }

  applyFilters(): void {
    this.filteredList = this.users.filter((user) => {
      const matchesSector = this.selectedSector
        ? user.sector === this.selectedSector
        : true;
      const matchesName = this.searchTerm
        ? (user.fullname || '')
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase())
        : true;
      return matchesSector && matchesName;
    });
  }

  resetFilters(): void {
    this.selectedSector = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  toggleStatus(user: User): void {
    if (!user._id) return;
    const newStatus: 'active' | 'inactive' =
      user.status === 'active' ? 'inactive' : 'active';
    this.adminService.updateDepartmentStatus(user._id, newStatus).subscribe({
      next: () => (user.status = newStatus),
      error: (err: HttpErrorResponse) =>
        console.error('خطأ في تحديث الحالة:', err.message),
    });
  }

  openEditUserModal(user: User): void {
    this.selectedUser = { ...user };
    const modalElement = document.getElementById('editUserModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  confirmEditUser(): void {
    if (!this.selectedUser._id || !this.selectedUser.fullname?.trim()) return;

    this.adminService
      .updateUser(this.selectedUser._id, {
        fullname: this.selectedUser.fullname.trim(),
      })
      .subscribe({
        next: (updatedUser) => {
          const target = this.users.find(
            (u) => u._id === this.selectedUser._id
          );
          if (target) target.fullname = updatedUser.fullname;

          // عرض إشعار نجاح
          Swal.fire({
            icon: 'success',
            title: 'تم تعديل المستخدم بنجاح',
            timer: 2000,
            showConfirmButton: false,
          });
          this.selectedUser = { _id: '' };
        },
        error: (err: HttpErrorResponse) =>
          Swal.fire({
            icon: 'error',
            title: 'حدث خطأ أثناء تعديل المستخدم',
            text: err.message,
          }),
      });
  }

  deleteUser(user: User): void {
    if (!user._id) return;

    Swal.fire({
      title: `هل أنت متأكد من حذف المستخدم ${user.fullname}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء',
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteUser(user._id).subscribe({
          next: () => {
            this.users = this.users.filter((u) => u._id !== user._id);
            this.applyFilters();
            Swal.fire({
              icon: 'success',
              title: 'تم حذف المستخدم بنجاح',
              timer: 2000,
              showConfirmButton: false,
            });
          },
          error: (err: HttpErrorResponse) =>
            Swal.fire({
              icon: 'error',
              title: 'حدث خطأ',
              text: err.message,
            }),
        });
      }
    });
  }

  loadSectors(): void {
    this.adminService.getAllSectors().subscribe({
      next: (data) => {
        this.sectors = data
          .filter((s) => s.sector)
          .map((s) => ({ _id: s._id, sector: s.sector }));
      },
      error: (err: HttpErrorResponse) =>
        console.error('خطأ في جلب القطاعات:', err.message),
    });
  }

  openSectorForm(): void {
    this.newSector = { sector: '' };
    this.showSectorForm = true;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  closeSectorForm(): void {
    this.showSectorForm = false;
    this.newSector = { sector: '' };
  }

  saveSector(): void {
    if (!this.newSector.sector.trim()) return;

    if (this.newSector._id) {
      this.adminService
        .updateSector(this.newSector._id, { sector: this.newSector.sector })
        .subscribe({
          next: (res) => {
            const index = this.sectors.findIndex(
              (s) => s._id === this.newSector._id
            );
            if (index !== -1) this.sectors[index] = res;
            this.closeSectorForm();
            Swal.fire({
              icon: 'success',
              title: 'تم تعديل القطاع بنجاح',
              timer: 2000,
              showConfirmButton: false,
            });
          },
          error: (err: HttpErrorResponse) =>
            console.error('خطأ في تعديل القطاع:', err.message),
        });
    } else {
      this.adminService.addSector(this.newSector).subscribe({
        next: (res) => {
          this.sectors.push(res);
          this.closeSectorForm();
          Swal.fire({
            icon: 'success',
            title: 'تمت إضافة القطاع بنجاح',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (err: HttpErrorResponse) =>
          console.error('خطأ في إضافة القطاع:', err.message),
      });
    }
  }

  editSector(sector: Sector): void {
    this.newSector = { ...sector };
    this.showSectorForm = true;
  }

  deleteSector(id?: string): void {
    if (!id) return;

    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من التراجع بعد حذف هذا القطاع!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteSector(id).subscribe({
          next: () => {
            this.loadSectors();
            Swal.fire({
              icon: 'success',
              title: 'تم الحذف!',
              text: 'تم حذف القطاع بنجاح.',
              timer: 2000,
              showConfirmButton: false,
            });
          },
          error: (err: HttpErrorResponse) =>
            Swal.fire({
              icon: 'error',
              title: 'خطأ',
              text: err.message || 'حدث خطأ أثناء حذف القطاع',
            }),
        });
      }
    });
  }

  openDepartmentForm(): void {
    this.newDepartment = {
      _id: '',
      fullname: '',
      username: '',
      password: '',
      role: '',
      sector: '',
    };
    this.showDepartmentForm = true;
  }

  closeDepartmentForm(): void {
    this.showDepartmentForm = false;
    this.newDepartment = {
      _id: '',
      fullname: '',
      username: '',
      password: '',
      role: '',
      sector: '',
    };
  }

  validatePassword(password: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(password);
  }

  saveDepartment(): void {
    const { fullname, username, password, role, sector } = this.newDepartment;

    if (!fullname || !username || !password || !role || !sector) {
      Swal.fire({
        icon: 'warning',
        title: 'يجب ملء جميع الحقول المطلوبة',
      });
      return;
    }

    if (!this.validatePassword(password)) {
      Swal.fire({
        icon: 'warning',
        title: 'كلمة المرور ضعيفة',
        html: `يجب أن تتكون كلمة المرور من 8 أحرف على الأقل وتحتوي على:<br>
             - حرف كبير واحد على الأقل<br>
             - حرف صغير واحد على الأقل<br>
             - رقم واحد<br>
             - حرف خاص واحد`,
      });
      return;
    }

    const departmentData = {
      fullname,
      username,
      password,
      role: role as 'user' | 'admin',
      sector,
    };

    this.adminService.addDepartment(departmentData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'تمت إضافة القسم بنجاح',
          timer: 2000,
          showConfirmButton: false,
        });
        this.closeDepartmentForm();
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) =>
        console.error('خطأ في إضافة القسم:', err.message),
    });
  }
}
