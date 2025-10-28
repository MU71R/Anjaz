import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MainCriterion } from 'src/app/model/criteria';
import { CriteriaService, SubCriteria } from 'src/app/service/criteria.service';
import Swal from 'sweetalert2';
import { ActivityService } from '../../service/achievements-service.service';

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
  subCriteria: SubCriteria[] = [];
  mainCriteria: MainCriterion[] = [];
  selectedMain = '';
  maxFiles = 2;
  maxFileSizeMB = 8;

  constructor(
    private fb: FormBuilder,
    private criteriaService: CriteriaService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadMainCriteria();
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
    if (this.attachments.length + files.length > this.maxFiles) {
      Swal.fire('تنبيه', `الحد الأقصى ${this.maxFiles} ملفات فقط.`, 'warning');
      return;
    }

    for (const f of files) {
      const sizeMB = f.size / (1024 * 1024);
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      const allowedImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];

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

  submitForReview() {
    this.syncDescriptionToForm();
    this.markAllFieldsAsTouched();

    if (this.form.invalid) {
      this.showValidationErrors();
      return;
    }

    const payload = this.createFormData('قيد المراجعة', 'مكتمل');
    Swal.fire({
      title: 'جاري الإرسال...',
      text: 'يرجى الانتظار قليلاً.',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.activityService.addActivity(payload).subscribe({
      next: () => {
        Swal.fire({
          title: 'تم الإرسال',
          text: 'تم إرسال النشاط بنجاح ',
          icon: 'success',
          confirmButtonText: 'حسناً',
        }).then(() => this.resetForm());
      },
      error: (err) => {
        console.error(' خطأ أثناء الإرسال:', err);
        Swal.fire({
          title: 'خطأ',
          text: err?.error?.message || 'حدث خطأ أثناء الإرسال إلى الخادم.',
          icon: 'error',
          confirmButtonText: 'حسناً',
        });
      },
    });
  }

  saveAsDraft() {
    this.syncDescriptionToForm();

    if (this.form.get('activityTitle')?.invalid) {
      Swal.fire('تنبيه', 'العنوان مطلوب لحفظ المسودة.', 'warning');
      return;
    }

const payload = this.createFormData('قيد المراجعة', 'مسودة');

    this.activityService.addActivity(payload).subscribe({
      next: () => {
        Swal.fire({
          title: 'تم الحفظ',
          text: 'تم حفظ المسودة بنجاح.',
          icon: 'success',
          confirmButtonText: 'حسناً',
        });
        this.resetForm();
      },
      error: (err) => {
        console.error('خطأ أثناء حفظ المسودة:', err);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل في حفظ المسودة.',
          icon: 'error',
          confirmButtonText: 'حسناً',
        });
      },
    });
  }

  private createFormData(
    status: 'مرفوض' | 'قيد المراجعة' | 'معتمد' | 'مسودة',
    saveStatus: 'مسودة' | 'مكتمل'
  ): FormData {
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

    console.log('FormData contents:');
    payload.forEach((v, k) => console.log(`${k}:`, v));

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
        this.resetForm();
        Swal.fire('تم', 'تم إلغاء العملية.', 'success');
      }
    });
  }

  resetForm() {
    this.form.reset();
    this.descriptionEditor.nativeElement.innerHTML = '';
    this.attachments = [];
    this.subCriteria = [];
    this.selectedMain = '';
  }
}
