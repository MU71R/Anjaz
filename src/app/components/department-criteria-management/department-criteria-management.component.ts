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
  // State
  departments: Department[] = [];
  sectors: Sector[] = [];

  mainCriteria: MainCriteria[] = [];
  subCriteria: SubCriteria[] = [];

  expandedCriteria = new Set<string>();

  // Modal states and form models (Main)
  isMainModalOpen = false;
  editingMain: MainCriteria | null = null;
  mainName = '';
  mainLevel: 'ALL' | 'SECTOR' | 'DEPARTMENT' = 'SECTOR';
  mainSectorId = '';
  mainDeptId = '';

  // Modal states and form models (Sub)
  isSubModalOpen = false;
  editingSub: SubCriteria | null = null;
  subName = '';
  subMainId = '';

  // Confirmation modal state
  isConfirmOpen = false;
  confirmMessage = '';
  private confirmCallback: ((confirmed: boolean) => void) | null = null;

  // Loading states
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

    // Load main criteria
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

    // Load sub criteria
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

    // Load sectors and departments from API
    this.loadSectorsAndDepartments();
  }

  loadSectorsAndDepartments(): void {
    this.isLoadingSectorsDepts = true;

    this.criteriaService.getAllSectors().subscribe({
      next: (response) => {
        if (response.success) {
          this.sectors = response.data;
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
        this.departments = departments;
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

  // ---------- Helpers ----------
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
        // التعامل مع object مباشرة
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
        // التعامل مع object مباشرة
        return (main.departmentUser as any).fullname || 'غير محدد';
      }
    }

    return '';
  }

  // دالة مساعدة محسنة
  getMainCriteriaInfo(main: MainCriteria): string {
    switch (main.level) {
      case 'ALL':
        return 'جميع القطاعات';
      case 'SECTOR':
        const sectorName = this.getSectorName(main);
        return sectorName ? `القطاع: ${sectorName}` : 'قطاع غير محدد';
      case 'DEPARTMENT':
        const deptName = this.getDepartmentName(main);
        return deptName ? `القسم: ${deptName}` : 'قسم غير محدد';
      default:
        return '';
    }
  }

  // ---------- Main criterion modals & actions ----------
  openMainModal(edit?: MainCriteria) {
    if (edit) {
      this.editingMain = { ...edit };
      this.mainName = edit.name;
      this.mainLevel = edit.level;

      // معالجة sector سواء كان string أو object
      if (edit.sector) {
        if (typeof edit.sector === 'string') {
          this.mainSectorId = edit.sector;
        } else {
          this.mainSectorId = (edit.sector as any)._id || '';
        }
      } else {
        this.mainSectorId = '';
      }

      // معالجة departmentUser سواء كان string أو object
      if (edit.departmentUser) {
        if (typeof edit.departmentUser === 'string') {
          this.mainDeptId = edit.departmentUser;
        } else {
          this.mainDeptId = (edit.departmentUser as any)._id || '';
        }
      } else {
        this.mainDeptId = '';
      }
    } else {
      this.editingMain = null;
      this.mainName = '';
      this.mainLevel = 'SECTOR';
      this.mainSectorId = '';
      this.mainDeptId = '';
    }
    this.isMainModalOpen = true;
  }

  closeMainModal() {
    this.isMainModalOpen = false;
    this.editingMain = null;
    this.mainName = '';
    this.mainLevel = 'SECTOR';
    this.mainSectorId = '';
    this.mainDeptId = '';
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
    if (this.mainLevel === 'SECTOR' && !this.mainSectorId) {
      Swal.fire({
        title: 'تنبيه',
        text: 'يرجى اختيار القطاع',
        icon: 'warning',
        confirmButtonText: 'حسناً',
      });
      return;
    }
    if (this.mainLevel === 'DEPARTMENT' && !this.mainDeptId) {
      Swal.fire({
        title: 'تنبيه',
        text: 'يرجى اختيار القسم',
        icon: 'warning',
        confirmButtonText: 'حسناً',
      });
      return;
    }

    this.isSubmitting = true;

    if (this.editingMain) {
      // بناء الـ request body بشكل صحيح
      const updateData: any = {
        id: this.editingMain._id,
        name: name,
        level: this.mainLevel,
      };

      // إضافة الحقول بناءً على المستوى
      if (this.mainLevel === 'SECTOR') {
        updateData.sector = this.mainSectorId;
        // تأكد من إرسال null للحقول الأخرى
        updateData.departmentUser = null;
      } else if (this.mainLevel === 'DEPARTMENT') {
        updateData.departmentUser = this.mainDeptId;
        updateData.sector = null;
      } else if (this.mainLevel === 'ALL') {
        updateData.sector = null;
        updateData.departmentUser = null;
      }

      console.log('Sending update data:', updateData); // للتصحيح

      this.criteriaService.updateMainCriteriaPartial(updateData).subscribe({
        next: (updatedCriteria) => {
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

          // تحليل الخطأ بشكل مفصل
          if (error.status === 401) {
            Swal.fire({
              title: 'انتهت الجلسة',
              text: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى',
              icon: 'warning',
              confirmButtonText: 'حسناً',
            }).then(() => {
              this.loginService.removeToken();
              location.reload();
            });
          } else {
            Swal.fire({
              title: 'خطأ',
              text:
                error.error?.error ||
                error.error?.message ||
                'حدث خطأ في تحديث المعيار الرئيسي',
              icon: 'error',
              confirmButtonText: 'حسناً',
            });
          }
          this.isSubmitting = false;
        },
      });
    } else {
      // إضافة معيار جديد - تم التصحيح هنا
      const criteriaData: AddMainCriteriaRequest = {
        name,
        level: this.mainLevel,
        sector: this.mainLevel === 'SECTOR' ? this.mainSectorId : undefined,
        departmentUser:
          this.mainLevel === 'DEPARTMENT' ? this.mainDeptId : undefined,
      };

      // استخدام addMainCriteria بدلاً من updateMainCriteriaPartial
      this.criteriaService.addMainCriteria(criteriaData).subscribe({
        next: (newCriteria) => {
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

  // ---------- Sub criterion modals & actions ----------
  openSubModal(mainId: string, edit?: SubCriteria) {
    if (edit) {
      this.editingSub = { ...edit };
      this.subName = edit.name;
      // لا نحتاج لحفظ subMainId في حالة التعديل
    } else {
      this.editingSub = null;
      this.subName = '';
      this.subMainId = mainId; // يتم تعيينه تلقائياً من mainId
    }
    this.isSubModalOpen = true;
  }

  closeSubModal() {
    this.isSubModalOpen = false;
    this.editingSub = null;
    this.subName = '';
    this.subMainId = '';
  }

  // دالة للحصول على اسم المعيار الرئيسي الحالي
  getCurrentMainCriteriaName(): string {
    if (this.editingSub) {
      // في حالة التعديل
      return this.getMainCriteriaName(this.editingSub.mainCriteria);
    } else {
      // في حالة الإضافة
      const main = this.mainCriteria.find((m) => m._id === this.subMainId);
      return main?.name || 'غير معروف';
    }
  }

  // دالة للحصول على اسم المعيار الرئيسي
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

  // ---------- Simple confirm modal ----------
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