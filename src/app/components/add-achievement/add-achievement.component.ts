import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MainCriterion } from 'src/app/model/criteria';
import { CriteriaService, SubCriteria } from 'src/app/service/criteria.service';
import Swal from 'sweetalert2';
import { ActivityService } from '../../service/achievements-service.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-add-achievement',
  templateUrl: './add-achievement.component.html',
  styleUrls: ['./add-achievement.component.css'],
})
export class AddAchievementComponent implements OnInit {
  @ViewChild('descriptionEditor', { static: true })
  descriptionEditor!: ElementRef<HTMLDivElement>;

  form!: FormGroup;
  attachments: File[] = [];
  existingAttachments: string[] = [];
  subCriteria: SubCriteria[] = [];
  mainCriteria: MainCriterion[] = [];
  selectedMain = '';
  maxFiles = 2;
  maxFileSizeMB = 8;
  isEditing = false;
  draftId: string = '';
  originalDraftData: any = null;
  deletedAttachments: string[] = [];

  constructor(
    private fb: FormBuilder,
    private criteriaService: CriteriaService,
    private activityService: ActivityService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadMainCriteria();
    this.checkEditMode();
  }

  checkEditMode(): void {
    this.route.queryParams.subscribe((params) => {
      this.isEditing = params['edit'] === 'true';
      this.draftId = params['draftId'] || '';

      if (this.isEditing) {
        this.loadDraftData();
      }
    });
  }

  loadDraftData(): void {
    const savedDraft = localStorage.getItem('editingDraft');

    if (savedDraft) {
      try {
        this.originalDraftData = JSON.parse(savedDraft);
        this.populateFormWithDraftData();
        console.log('Loaded draft data for editing:', this.originalDraftData);
      } catch (error) {
        console.error('Error parsing draft data:', error);
        Swal.fire('خطأ', 'حدث خطأ في تحميل بيانات المسودة', 'error');
      }
    } else {
      console.warn('No draft data found in localStorage');
      Swal.fire('تنبيه', 'لم يتم العثور على بيانات المسودة', 'warning');
    }
  }

  populateFormWithDraftData(): void {
    if (this.originalDraftData && this.form) {
      console.log('Populating form with draft data...');

      this.form.patchValue({
        activityTitle: this.originalDraftData.activityTitle,
        activityDescription: this.originalDraftData.activityDescription,
        MainCriteria:
          this.originalDraftData.MainCriteria?._id ||
          this.originalDraftData.MainCriteria,
        SubCriteria:
          this.originalDraftData.SubCriteria?._id ||
          this.originalDraftData.SubCriteria,
        name: this.originalDraftData.name,
      });

      if (
        this.originalDraftData.Attachments &&
        Array.isArray(this.originalDraftData.Attachments)
      ) {
        this.existingAttachments = [...this.originalDraftData.Attachments];
        console.log(
          'Loaded existing attachments:',
          this.existingAttachments
        );
        console.log(
          'Number of attachments:',
          this.existingAttachments.length
        );
      } else {
        console.warn('No attachments found in draft data');
        this.existingAttachments = [];
      }

      const mainCriteriaId =
        this.originalDraftData.MainCriteria?._id ||
        this.originalDraftData.MainCriteria;
      if (mainCriteriaId) {
        this.selectedMain = mainCriteriaId;
        this.getSubCriteria(mainCriteriaId);
      }

      if (this.descriptionEditor) {
        this.descriptionEditor.nativeElement.innerHTML =
          this.originalDraftData.activityDescription || '';
      }

      console.log('Form populated successfully');
      console.log('Final existingAttachments:', this.existingAttachments);
    }
  }

  initializeForm(): void {
    this.form = this.fb.group(
      {
        activityTitle: ['', [Validators.required, Validators.maxLength(150)]],
        activityDescription: [
          '',
          [
            Validators.required,
            Validators.minLength(10),
            Validators.maxLength(300),
          ],
        ],
        MainCriteria: ['', Validators.required],
        SubCriteria: ['', Validators.required],
        name: [''],
      },
      { updateOn: 'change' }
    );
  }

  loadMainCriteria(): void {
    this.criteriaService.getAllMainCriteria().subscribe({
      next: (res: any[]) => {
        this.mainCriteria = res;
        console.log(' Main Criteria:', res);
      },
      error: () => {
        Swal.fire({
          title: 'خطأ',
          text: 'تعذر تحميل المعايير الرئيسية من الخادم.',
          icon: 'error',
          confirmButtonText: 'حسناً',
        });
        this.mainCriteria = [];
      },
    });
  }

  onMainCriterionChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.selectedMain = target?.value ?? '';
    this.form.patchValue({ SubCriteria: '' });

    if (this.selectedMain) {
      this.getSubCriteria(this.selectedMain);
    } else {
      this.subCriteria = [];
    }
  }

  getSubCriteria(mainId: string): void {
    this.criteriaService.getAllSubCriteria().subscribe({
      next: (res: SubCriteria[]) => {
        this.subCriteria = res.filter((sub) => {
          const mcId =
            typeof sub.mainCriteria === 'string'
              ? sub.mainCriteria
              : sub.mainCriteria._id;
          return mcId === mainId;
        });
        console.log('Filtered Subcriteria:', this.subCriteria);
      },
      error: (err) => {
        console.error('Error loading sub-criteria:', err);
        Swal.fire({
          title: 'خطأ',
          text: 'حدث خطأ أثناء تحميل المعايير الفرعية من الخادم.',
          icon: 'error',
          confirmButtonText: 'حسناً',
        });
        this.subCriteria = [];
      },
    });
  }

  exec(command: string, value?: string) {
    this.descriptionEditor.nativeElement.focus();
    document.execCommand(command, false, value);
    this.syncDescriptionToForm();
  }

  syncDescriptionToForm() {
    let html = this.descriptionEditor.nativeElement.innerHTML.trim();

    const text = html
      .replace(/<br\s*\/?>/gi, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]*>/g, '')
      .trim();

    this.form.get('activityDescription')?.setValue(text);
    this.form.get('activityDescription')?.markAsTouched();
  }

  onFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    const totalFiles =
      this.attachments.length + files.length + this.existingAttachments.length;

    if (totalFiles > this.maxFiles) {
      Swal.fire('تنبيه', `الحد الأقصى ${this.maxFiles} ملفات فقط.`, 'warning');
      return;
    }

    for (const f of files) {
      const sizeMB = f.size / (1024 * 1024);
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      const allowedImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];

      if (ext === 'pdf') {
        Swal.fire({
          title: 'تأكيد',
          text: 'هل تريد حقاً إضافة ملف PDF؟',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'نعم',
          cancelButtonText: 'لا',
        }).then((result) => {
          if (!result.isConfirmed) {
            return; 
          }
        });
      }

      if (!(ext === 'pdf' || allowedImage.includes(ext))) {
        Swal.fire(
          'خطأ',
          'نوع ملف غير مدعوم. يُسمح فقط بالصور أو PDF.',
          'error'
        );
        continue;
      }
      if (sizeMB > this.maxFileSizeMB) {
        Swal.fire('خطأ', `حجم الملف أكبر من ${this.maxFileSizeMB}MB.`, 'error');
        continue;
      }
      this.attachments.push(f);
    }

    input.value = '';
  }

  removeAttachment(index: number) {
    this.attachments.splice(index, 1);
    Swal.fire('تم', 'تم حذف الملف بنجاح.', 'success');
  }

  removeExistingAttachment(index: number) {
    const attachmentToRemove = this.existingAttachments[index];

    Swal.fire({
      title: 'تأكيد الحذف',
      text: 'هل تريد حذف هذا المرفق؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deletedAttachments.push(attachmentToRemove);
        this.existingAttachments.splice(index, 1);
        Swal.fire('تم', 'تم حذف الملف بنجاح.', 'success');
      }
    });
  }

  submitForReview() {
    this.syncDescriptionToForm();
    this.markAllFieldsAsTouched();

    if (this.form.invalid) {
      this.showValidationErrors();
      return;
    }

    if (this.isEditing) {
      this.updateDraft('قيد المراجعة', 'مكتمل');
    } else {
      this.addNewActivity('قيد المراجعة', 'مكتمل');
    }
  }

  saveAsDraft() {
    this.syncDescriptionToForm();

    if (this.form.get('activityTitle')?.invalid) {
      Swal.fire('تنبيه', 'العنوان مطلوب لحفظ المسودة.', 'warning');
      return;
    }

    if (this.isEditing) {
      this.updateDraft('قيد المراجعة', 'مسودة');
    } else {
      this.addNewActivity('قيد المراجعة', 'مسودة');
    }
  }

  private addNewActivity(status: string, saveStatus: string) {
    const payload = this.createFormData(status, saveStatus);

    Swal.fire({
      title: 'جاري الحفظ...',
      text: 'يرجى الانتظار قليلاً.',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.activityService.addActivity(payload).subscribe({
      next: () => {
        const message =
          saveStatus === 'مسودة'
            ? 'تم حفظ المسودة بنجاح'
            : 'تم إرسال النشاط بنجاح للمراجعة';
        Swal.fire({
          title: 'تم',
          text: message,
          icon: 'success',
          confirmButtonText: 'حسناً',
        }).then(() => {
          this.cleanupForm();
        });
      },
      error: (err) => {
        console.error('خطأ أثناء الحفظ:', err);
        Swal.fire({
          title: 'خطأ',
          text: err?.error?.message || 'حدث خطأ أثناء الحفظ.',
          icon: 'error',
          confirmButtonText: 'حسناً',
        });
      },
    });
  }

  private updateDraft(status: string, saveStatus: string) {
    const payload = this.createFormData(status, saveStatus);

    Swal.fire({
      title: 'جاري التحديث...',
      text: 'يرجى الانتظار قليلاً.',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.activityService.updateDraftActivity(this.draftId, payload).subscribe({
      next: (response) => {
        const message =
          saveStatus === 'مسودة'
            ? 'تم تحديث المسودة بنجاح'
            : 'تم إرسال النشاط بنجاح للمراجعة';
        Swal.fire({
          title: 'تم',
          text: message,
          icon: 'success',
          confirmButtonText: 'حسناً',
        }).then(() => {
          this.cleanupForm();
        });
      },
      error: (err) => {
        console.error('خطأ أثناء التحديث:', err);
        Swal.fire({
          title: 'خطأ',
          text: err?.error?.message || 'حدث خطأ أثناء التحديث.',
          icon: 'error',
          confirmButtonText: 'حسناً',
        });
      },
    });
  }

  private createFormData(status: string, saveStatus: string): FormData {
    const payload = new FormData();
    payload.append('activityTitle', this.form.value.activityTitle);
    payload.append('activityDescription', this.form.value.activityDescription);
    payload.append('MainCriteria', this.form.value.MainCriteria);
    payload.append('SubCriteria', this.form.value.SubCriteria);
    payload.append('status', status);
    payload.append('SaveStatus', saveStatus);
    payload.append('user', localStorage.getItem('userId') || '');
    payload.append(
      'name',
      this.form.value.name || localStorage.getItem('fullname') || ''
    );

    this.attachments.forEach((file) => {
      payload.append('Attachments', file, file.name);
    });

    this.existingAttachments.forEach((attachment) => {
      payload.append('existingAttachments', attachment);
    });

    this.deletedAttachments.forEach((deletedAttachment) => {
      payload.append('deletedAttachments', deletedAttachment);
    });

    console.log('إرسال البيانات:');
    console.log('مرفقات جديدة:', this.attachments.length);
    console.log('مرفقات قديمة متبقية:', this.existingAttachments.length);
    console.log('مرفقات محذوفة:', this.deletedAttachments.length);

    return payload;
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsTouched();
    });
  }

  private showValidationErrors(): void {
    const errors: string[] = [];

    if (this.form.get('activityTitle')?.invalid)
      errors.push('• العنوان مطلوب (حتى 150 حرف)');
    if (this.form.get('activityDescription')?.invalid)
      errors.push('• الوصف مطلوب (10 أحرف على الأقل)');
    if (this.form.get('MainCriteria')?.invalid)
      errors.push('• المعيار الرئيسي مطلوب');
    if (this.form.get('SubCriteria')?.invalid)
      errors.push('• المعيار الفرعي مطلوب');

    Swal.fire({
      title: 'بيانات ناقصة',
      html: `يرجى ملء جميع الحقول المطلوبة:<br>${errors.join('<br>')}`,
      icon: 'warning',
      confirmButtonText: 'حسناً',
    });
  }

  cancel() {
    Swal.fire({
      title: 'تأكيد الإلغاء',
      text: 'هل تريد إلغاء العملية؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم',
      cancelButtonText: 'لا',
    }).then((r) => {
      if (r.isConfirmed) {
        this.cleanupForm();
      }
    });
  }

  private cleanupForm() {
    localStorage.removeItem('editingDraft');
    this.resetForm();
  }

  resetForm() {
    this.form.reset();
    if (this.descriptionEditor) {
      this.descriptionEditor.nativeElement.innerHTML = '';
    }
    this.attachments = [];
    this.existingAttachments = [];
    this.deletedAttachments = []; 
    this.subCriteria = [];
    this.selectedMain = '';
    this.isEditing = false;
    this.draftId = '';
    this.originalDraftData = null;
  }

  ngOnDestroy(): void {
    this.cleanupForm();
  }

  getFileName(attachmentUrl: string): string {
    if (!attachmentUrl) return 'ملف';
    const parts = attachmentUrl.split('/');
    return parts[parts.length - 1] || 'ملف';
  }

  getFileType(attachmentUrl: string): string {
    if (!attachmentUrl) return '';
    const ext = attachmentUrl.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'PDF';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext))
      return 'صورة';
    return 'ملف';
  }

  isImage(attachmentUrl: string): boolean {
    if (!attachmentUrl) return false;
    const ext = attachmentUrl.split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext);
  }

  isImageFile(file: File): boolean {
    if (!file) return false;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext);
  }

  getFullAttachmentUrl(attachmentPath: string): string {
    if (!attachmentPath) return '';
    if (attachmentPath.startsWith('http')) {
      return attachmentPath;
    }
    if (attachmentPath.startsWith('/uploads/')) {
      return `http://localhost:3000${attachmentPath}`;
    }
    if (attachmentPath.startsWith('uploads/')) {
      return `http://localhost:3000/${attachmentPath}`;
    }
    return `http://localhost:3000/uploads/${attachmentPath}`;
  }

  getFilePreview(file: File): string {
    if (this.isImageFile(file)) {
      return URL.createObjectURL(file);
    }
    return '';
  }

  viewAttachment(attachmentUrl: string): void {
    const fullUrl = this.getFullAttachmentUrl(attachmentUrl);
    window.open(fullUrl, '_blank');
  }

  debugDraftData(): void {
    console.log('=== DEBUG DRAFT DATA ===');
    console.log('isEditing:', this.isEditing);
    console.log('draftId:', this.draftId);
    console.log('originalDraftData:', this.originalDraftData);
    console.log('existingAttachments:', this.existingAttachments);
    console.log('attachments:', this.attachments);
    console.log('deletedAttachments:', this.deletedAttachments);
    console.log('form values:', this.form.value);
    console.log('mainCriteria:', this.mainCriteria);
    console.log('subCriteria:', this.subCriteria);
    console.log('selectedMain:', this.selectedMain);
    console.log('========================');
  }
}
