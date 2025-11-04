import { Component, OnInit } from '@angular/core';
import {
  CriteriaService,
  MainCriteria,
  SubCriteria,
  AddMainCriteriaRequest,
  AddSubCriteriaRequest,
  Department,
  Sector,
} from '../../service/criteria.service';
import { LoginService } from '../../service/login.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-department-criteria-management',
  templateUrl: './department-criteria-management.component.html',
  styleUrls: ['./department-criteria-management.component.css'],
})
export class DepartmentCriteriaManagementComponent implements OnInit {
  departments: Department[] = [];
  filteredDepartments: Department[] = []; 
  sectors: Sector[] = [];
  mainCriteria: MainCriteria[] = [];
  subCriteria: SubCriteria[] = [];
  expandedCriteria = new Set<string>();
  isMainModalOpen = false;
  editingMain: MainCriteria | null = null;
  mainName = '';
  mainSectorId = 'ALL';
  mainDeptId = ''; 
  isSubModalOpen = false;
  editingSub: SubCriteria | null = null;
  subName = '';
  subMainId = '';
  isConfirmOpen = false;
  confirmMessage = '';
  private confirmCallback: ((confirmed: boolean) => void) | null = null;
  isLoading = false;
  isSubmitting = false;
  isLoadingSectorsDepts = false;

  constructor(
    private criteriaService: CriteriaService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    if (!this.loginService.getTokenFromLocalStorage()) {
      Swal.fire({
        title: 'تنبيه',
        text: 'يجب تسجيل الدخول أولاً',
        icon: 'warning',
        confirmButtonText: 'حسناً',
      });
      return;
    }
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading = true;

    this.criteriaService.getAllMainCriteria().subscribe({
      next: (data) => {
        this.mainCriteria = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading main criteria:', error);
        Swal.fire({
          title: 'خطأ',
          text: 'حدث خطأ في تحميل البيانات',
          icon: 'error',
          confirmButtonText: 'حسناً',
        });
        this.isLoading = false;
      },
    });

    this.criteriaService.getAllSubCriteria().subscribe({
      next: (data) => {
        this.subCriteria = data;
      },
      error: (error) => {
        console.error('Error loading sub criteria:', error);
        Swal.fire({
          title: 'خطأ',
          text: 'حدث خطأ في تحميل المعايير الفرعية',
          icon: 'error',
          confirmButtonText: 'حسناً',
        });
      },
    });

    this.loadSectorsAndDepartments();
  }

  loadSectorsAndDepartments(): void {
    this.isLoadingSectorsDepts = true;

    this.criteriaService.getAllSectors().subscribe({
      next: (response) => {
        console.log('Sectors API Response:', response);
        if (response.success) {
          this.sectors = response.data;
          console.log('Sectors loaded:', this.sectors);
        } else {
          console.log('Sectors response not successful:', response);
        }
      },
      error: (error) => {
        console.error('Error loading sectors:', error);
        Swal.fire({
          title: 'خطأ',
          text: 'حدث خطأ في تحميل القطاعات',
          icon: 'error',
          confirmButtonText: 'حسناً',
        });
      },
    });

    this.criteriaService.getAllDepartments().subscribe({
      next: (departments) => {
        console.log('Departments loaded:', departments);
        this.departments = departments;
        this.filteredDepartments = []; 
        this.isLoadingSectorsDepts = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        Swal.fire({
          title: 'خطأ',
          text: 'حدث خطأ في تحميل الأقسام',
          icon: 'error',
          confirmButtonText: 'حسناً',
        });
        this.isLoadingSectorsDepts = false;
      },
    });
  }

  filterDepartmentsBySector(sectorId: string): void {
    if (sectorId === 'ALL') {
      this.filteredDepartments = [];
      this.mainDeptId = ''; 
    } else {
      this.filteredDepartments = this.departments.filter(
        (dept) =>
          dept.sector === sectorId ||
          (dept as any).sectorId === sectorId ||
          (dept as any).sector?._id === sectorId
      );
      if (this.filteredDepartments.length === 0) {
        this.filteredDepartments = this.departments;
      }
      if (
        this.mainDeptId &&
        !this.filteredDepartments.find((d) => d._id === this.mainDeptId)
      ) {
        this.mainDeptId = '';
      }
    }
  }

  onSectorChange(): void {
    this.filterDepartmentsBySector(this.mainSectorId);
  }

  getSectorDisplayName(sector: any): string {
    if (!sector) return 'غير محدد';
    if (sector.name) return sector.name;
    if (sector.sectorName) return sector.sectorName;
    if (sector.title) return sector.title;
    if (sector.sector) return sector.sector;
    return 'قطاع بدون اسم';
  }

  getSectorId(sector: any): string {
    if (!sector) return '';
    if (sector._id) return sector._id;
    if (sector.id) return sector.id;
    return '';
  }

  toggleExpanded(id: string) {
    if (this.expandedCriteria.has(id)) this.expandedCriteria.delete(id);
    else this.expandedCriteria.add(id);
    this.expandedCriteria = new Set(this.expandedCriteria);
  }

  getSubForMain(mainId: string): SubCriteria[] {
    return this.subCriteria.filter((s) =>
      typeof s.mainCriteria === 'string'
        ? s.mainCriteria === mainId
        : s.mainCriteria._id === mainId
    );
  }

  levelLabel(level: 'ALL' | 'SECTOR' | 'DEPARTMENT'): string {
    const labels = {
      ALL: 'جميع القطاعات',
      SECTOR: 'مستوى القطاع',
      DEPARTMENT: 'مستوى القسم',
    };
    return labels[level];
  }

  getSectorName(main: MainCriteria): string {
    if (main.level === 'ALL') {
      return 'جميع القطاعات';
    }

    if (main.level === 'SECTOR' && main.sector) {
      if (typeof main.sector === 'string') {
        const sectorId = main.sector as unknown as string;
        const sector = this.sectors.find((s) => s._id === sectorId);
        return sector?.name || 'غير محدد';
      } else {
        return (main.sector as any).name || 'غير محدد';
      }
    }

    return '';
  }

  getDepartmentName(main: MainCriteria): string {
    if (main.level === 'DEPARTMENT' && main.departmentUser) {
      if (typeof main.departmentUser === 'string') {
        const dept = this.departments.find(
          (d) => d._id === (main.departmentUser as unknown as string)
        );
        return dept?.fullname || 'غير محدد';
      } else {
        return (main.departmentUser as any).fullname || 'غير محدد';
      }
    }

    return '';
  }

  openMainModal(edit?: MainCriteria) {
    this.loadSectorsAndDepartments();

    console.log('Opening main modal, sectors:', this.sectors);
    console.log('Opening main modal, departments:', this.departments);

    if (edit) {
      this.editingMain = { ...edit };
      this.mainName = edit.name;

      console.log('Editing main criteria:', edit);
      if (edit.level === 'ALL') {
        this.mainSectorId = 'ALL';
      } else if (edit.sector) {
        if (typeof edit.sector === 'string') {
          this.mainSectorId = edit.sector;
        } else {
          this.mainSectorId = (edit.sector as any)._id || '';
        }
      } else {
        this.mainSectorId = 'ALL';
      }

      if (edit.departmentUser) {
        if (typeof edit.departmentUser === 'string') {
          this.mainDeptId = edit.departmentUser;
        } else {
          this.mainDeptId = (edit.departmentUser as any)._id || '';
        }
      } else {
        this.mainDeptId = '';
      }

      this.filterDepartmentsBySector(this.mainSectorId);

      console.log(
        'After processing - Sector ID:',
        this.mainSectorId,
        'Dept ID:',
        this.mainDeptId
      );
    } else {
      this.editingMain = null;
      this.mainName = '';
      this.mainSectorId = 'ALL'; 
      this.mainDeptId = ''; 
      this.filteredDepartments = []; 
    }
    this.isMainModalOpen = true;
  }

  closeMainModal() {
    this.isMainModalOpen = false;
    this.editingMain = null;
    this.mainName = '';
    this.mainSectorId = 'ALL';
    this.mainDeptId = '';
    this.filteredDepartments = [];
  }

  submitMain() {
    const name = (this.mainName || '').trim();
    if (!name) {
      Swal.fire({
        title: 'تنبيه',
        text: 'يرجى إدخال اسم المعيار الرئيسي',
        icon: 'warning',
        confirmButtonText: 'حسناً',
      });
      return;
    }

    this.isSubmitting = true;

    let level: 'ALL' | 'SECTOR' | 'DEPARTMENT' = 'ALL';
    let sectorId: string | null = null;
    let departmentId: string | null = null;

    if (this.mainSectorId === 'ALL') {
      level = 'ALL';
      sectorId = null;
      departmentId = null;
    } else {
      level = 'SECTOR';
      sectorId = this.mainSectorId;

      if (this.mainDeptId) {
        level = 'DEPARTMENT';
        departmentId = this.mainDeptId;
      }
    }

    if (this.editingMain) {
      const updateData: any = {
        id: this.editingMain._id,
        name: name,
        level: level,
      };

      if (level === 'ALL') {
        updateData.sector = null;
        updateData.departmentUser = null;
      } else if (level === 'SECTOR') {
        updateData.sector = sectorId;
        updateData.departmentUser = null;
      } else if (level === 'DEPARTMENT') {
        updateData.sector = sectorId;
        updateData.departmentUser = departmentId;
      }

      console.log('Sending UPDATE data:', updateData);

      this.criteriaService.updateMainCriteriaPartial(updateData).subscribe({
        next: (updatedCriteria) => {
          console.log('UPDATE response:', updatedCriteria);
          this.mainCriteria = this.mainCriteria.map((m) =>
            m._id === this.editingMain!._id ? updatedCriteria : m
          );
          Swal.fire({
            title: 'نجاح',
            text: 'تم تحديث المعيار الرئيسي بنجاح',
            icon: 'success',
            confirmButtonText: 'حسناً',
          });
          this.isSubmitting = false;
          this.closeMainModal();
        },
        error: (error) => {
          console.error('Error updating main criteria:', error);
          console.error('Error details:', error.error);
          this.isSubmitting = false;
        },
      });
    } else {
      const criteriaData: any = {
        name,
        level: level,
      };

      if (level === 'ALL') {
        criteriaData.sector = null;
        criteriaData.departmentUser = null;
      } else if (level === 'SECTOR') {
        criteriaData.sector = sectorId;
        criteriaData.departmentUser = null;
      } else if (level === 'DEPARTMENT') {
        criteriaData.sector = sectorId;
        criteriaData.departmentUser = departmentId;
      }

      console.log('Sending CREATE data:', criteriaData);
      this.criteriaService.addMainCriteria(criteriaData).subscribe({
        next: (newCriteria) => {
          console.log('CREATE response:', newCriteria);
          this.mainCriteria = [...this.mainCriteria, newCriteria];
          Swal.fire({
            title: 'نجاح',
            text: 'تم إضافة المعيار الرئيسي بنجاح',
            icon: 'success',
            confirmButtonText: 'حسناً',
          });
          this.isSubmitting = false;
          this.closeMainModal();
        },
        error: (error) => {
          console.error('Error adding main criteria:', error);
          console.error('Error details:', error.error);
          Swal.fire({
            title: 'خطأ',
            text: error.error?.error || 'حدث خطأ في إضافة المعيار الرئيسي',
            icon: 'error',
            confirmButtonText: 'حسناً',
          });
          this.isSubmitting = false;
        },
      });
    }
  }

  requestDeleteMain(id: string) {
    const used = this.subCriteria.some((s) =>
      typeof s.mainCriteria === 'string'
        ? s.mainCriteria === id
        : s.mainCriteria._id === id
    );
    if (used) {
      Swal.fire({
        title: 'تنبيه',
        text: 'لا يمكن حذف المعيار الرئيسي لأنه مرتبط بمعايير فرعية',
        icon: 'warning',
        confirmButtonText: 'حسناً',
      });
      return;
    }

    this.openConfirm(
      'هل أنت متأكد من حذف هذا المعيار الرئيسي؟ لا يمكن التراجع عن هذا الإجراء.',
      (ok) => {
        if (!ok) return;

        this.criteriaService.deleteMainCriteria(id).subscribe({
          next: () => {
            this.mainCriteria = this.mainCriteria.filter((m) => m._id !== id);
            Swal.fire({
              title: 'نجاح',
              text: 'تم حذف المعيار الرئيسي بنجاح',
              icon: 'success',
              confirmButtonText: 'حسناً',
            });
          },
          error: (error) => {
            console.error('Error deleting main criteria:', error);
            Swal.fire({
              title: 'خطأ',
              text: 'حدث خطأ في حذف المعيار الرئيسي',
              icon: 'error',
              confirmButtonText: 'حسناً',
            });
          },
        });
      }
    );
  }

  openSubModal(mainId: string, edit?: SubCriteria) {
    if (edit) {
      this.editingSub = { ...edit };
      this.subName = edit.name;
    } else {
      this.editingSub = null;
      this.subName = '';
      this.subMainId = mainId;
    }
    this.isSubModalOpen = true;
  }

  closeSubModal() {
    this.isSubModalOpen = false;
    this.editingSub = null;
    this.subName = '';
    this.subMainId = '';
  }

  getCurrentMainCriteriaName(): string {
    if (this.editingSub) {
      return this.getMainCriteriaName(this.editingSub.mainCriteria);
    } else {
      const main = this.mainCriteria.find((m) => m._id === this.subMainId);
      return main?.name || 'غير معروف';
    }
  }

  getMainCriteriaName(
    mainCriteria: string | { _id: string; name: string }
  ): string {
    if (typeof mainCriteria === 'string') {
      const main = this.mainCriteria.find((m) => m._id === mainCriteria);
      return main?.name || 'غير معروف';
    }
    return mainCriteria.name;
  }

  submitSub() {
    const name = (this.subName || '').trim();
    if (!name) {
      Swal.fire({
        title: 'تنبيه',
        text: 'يرجى إدخال اسم المعيار الفرعي',
        icon: 'warning',
        confirmButtonText: 'حسناً',
      });
      return;
    }

    this.isSubmitting = true;

    if (this.editingSub) {
      this.criteriaService
        .updateSubCriteria(this.editingSub._id, name)
        .subscribe({
          next: (updatedSub) => {
            this.subCriteria = this.subCriteria.map((s) =>
              s._id === this.editingSub!._id ? updatedSub : s
            );
            Swal.fire({
              title: 'نجاح',
              text: 'تم تحديث المعيار الفرعي بنجاح',
              icon: 'success',
              confirmButtonText: 'حسناً',
            });
            this.isSubmitting = false;
            this.closeSubModal();
          },
          error: (error) => {
            console.error('Error updating sub criteria:', error);
            Swal.fire({
              title: 'خطأ',
              text: 'حدث خطأ في تحديث المعيار الفرعي',
              icon: 'error',
              confirmButtonText: 'حسناً',
            });
            this.isSubmitting = false;
          },
        });
    } else {
      const subCriteriaData: AddSubCriteriaRequest = {
        name,
        mainCriteria: this.subMainId,
      };

      this.criteriaService.addSubCriteria(subCriteriaData).subscribe({
        next: (newSub) => {
          this.subCriteria = [...this.subCriteria, newSub];
          Swal.fire({
            title: 'نجاح',
            text: 'تم إضافة المعيار الفرعي بنجاح',
            icon: 'success',
            confirmButtonText: 'حسناً',
          });
          this.isSubmitting = false;
          this.closeSubModal();
        },
        error: (error) => {
          console.error('Error adding sub criteria:', error);
          Swal.fire({
            title: 'خطأ',
            text: error.error?.error || 'حدث خطأ في إضافة المعيار الفرعي',
            icon: 'error',
            confirmButtonText: 'حسناً',
          });
          this.isSubmitting = false;
        },
      });
    }
  }

  requestDeleteSub(id: string) {
    this.openConfirm(
      'هل أنت متأكد من حذف هذا المعيار الفرعي؟ لا يمكن التراجع عن هذا الإجراء.',
      (ok) => {
        if (!ok) return;

        this.criteriaService.deleteSubCriteria(id).subscribe({
          next: () => {
            this.subCriteria = this.subCriteria.filter((s) => s._id !== id);
            Swal.fire({
              title: 'نجاح',
              text: 'تم حذف المعيار الفرعي بنجاح',
              icon: 'success',
              confirmButtonText: 'حسناً',
            });
          },
          error: (error) => {
            console.error('Error deleting sub criteria:', error);
            Swal.fire({
              title: 'خطأ',
              text: 'حدث خطأ في حذف المعيار الفرعي',
              icon: 'error',
              confirmButtonText: 'حسناً',
            });
          },
        });
      }
    );
  }

  private openConfirm(message: string, cb: (confirmed: boolean) => void) {
    this.confirmMessage = message;
    this.confirmCallback = cb;
    this.isConfirmOpen = true;
  }

  confirmClose(ok: boolean) {
    this.isConfirmOpen = false;
    if (this.confirmCallback) {
      const cb = this.confirmCallback;
      this.confirmCallback = null;
      cb(ok);
    }
  }

  
}
