import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MainCriterion } from 'src/app/model/criteria';
import { CriteriaService, SubCriteria } from 'src/app/service/criteria.service';
import Swal from 'sweetalert2';

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
    private criteriaService: CriteriaService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      mainCriterion: ['', Validators.required],
      subCriterion: [''],
    });

    this.criteriaService.getAllMainCriteria().subscribe({
      next: (res: any[]) => {
        this.mainCriteria = res;
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

    if (this.selectedMain) {
      this.getSubCriteria(this.selectedMain);
    } else {
      this.subCriteria = [];
    }
  }

  getSubCriteria(mainId: string): void {
    this.criteriaService.getAllSubCriteria().subscribe({
      next: (res: SubCriteria[]) => {
        this.subCriteria = res;
        console.log('✅ Subcriteria:', res);
      },
      error: () => {
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
    const html = this.descriptionEditor.nativeElement.innerHTML.trim();
    this.form.get('description')?.setValue(html);
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

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire('تنبيه', 'يرجى ملء جميع الحقول المطلوبة.', 'warning');
      return;
    }

    const payload = new FormData();
    payload.append('title', this.form.value.title);
    payload.append('description', this.form.value.description);
    payload.append('mainCriterion', this.form.value.mainCriterion);
    payload.append('subCriterion', this.form.value.subCriterion);
    payload.append('status', 'pending');
    this.attachments.forEach((f) => payload.append('attachments', f, f.name));

    console.log('Submitting:', {
      form: this.form.value,
      attachments: this.attachments,
    });

    Swal.fire({
      title: 'تم الإرسال',
      text: 'تم إرسال الإنجاز للمراجعة بنجاح.',
      icon: 'success',
      confirmButtonText: 'حسناً',
    }).then(() => this.resetForm());
  }

  saveAsDraft() {
    this.syncDescriptionToForm();

    if (this.form.get('title')?.invalid) {
      Swal.fire('تنبيه', 'العنوان مطلوب لحفظ المسودة.', 'warning');
      return;
    }

    const payload = new FormData();
    payload.append('title', this.form.value.title);
    payload.append('description', this.form.value.description || '');
    payload.append('mainCriterion', this.form.value.mainCriterion || '');
    payload.append('status', 'draft');
    this.attachments.forEach((f) => payload.append('attachments', f, f.name));

    console.log('Saving draft:', {
      form: this.form.value,
      attachments: this.attachments,
    });

    Swal.fire({
      title: 'تم الحفظ',
      text: 'تم حفظ المسودة بنجاح.',
      icon: 'success',
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
    }).then((result) => {
      if (result.isConfirmed) {
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
