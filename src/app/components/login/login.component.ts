import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from 'src/app/service/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  showPassword: boolean = false;

  // ✅ توجيه جميع المستخدمين إلى /dashboard بغض النظر عن الـ role
  private targetRoute: string = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public loginService: LoginService,
    private toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20),
        ],
      ],
    });
  }

  ngOnInit(): void {
    // ✅ التحقق إذا كان المستخدم مسجل دخول بالفعل وتوجيهه مباشرة إلى dashboard
    if (
      this.loginService.getTokenFromLocalStorage() &&
      !this.loginService.isTokenExpired(
        this.loginService.getTokenFromLocalStorage()!
      )
    ) {
      this.redirectToDashboard();
      return;
    }

    const loggedOut = localStorage.getItem('loggedOut');
    if (loggedOut) {
      this.toastr.info('تم تسجيل الخروج بنجاح', 'تسجيل الخروج');
      localStorage.removeItem('loggedOut');
    }

    this.loginForm.valueChanges.subscribe(() => {
      this.errorMessage = '';
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  login(): void {
    if (this.loginForm.invalid) {
      Object.values(this.f).forEach((control) => control.markAsTouched());
      this.toastr.warning('يرجى إدخال البيانات بشكل صحيح', 'تحذير');
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const loginData = {
      username: this.loginForm.value.username.trim(),
      password: this.loginForm.value.password,
    };

    this.loginService.login(loginData).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        if (response.token && response.user) {
          localStorage.setItem('token', response.token);
          this.loginService.setUser(response.user);

          const userName = response.user.fullname || response.user.username;

          this.toastr.success(`مرحباً ${userName}!`, 'تم تسجيل الدخول بنجاح');

          // ✅ توجيه جميع المستخدمين إلى dashboard
          this.redirectToDashboard();
        } else {
          this.errorMessage = 'لم يتم استلام بيانات الدخول بشكل صحيح.';
          this.toastr.error(this.errorMessage, 'خطأ');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.extractErrorMessage(error);
        this.toastr.error(this.errorMessage, 'فشل تسجيل الدخول');
      },
    });
  }

  /**
   * ✅ توجيه جميع المستخدمين إلى dashboard
   */
  private redirectToDashboard(): void {
    // تأخير بسيط لضمان حفظ البيانات قبل التوجيه
    setTimeout(() => {
      this.router.navigate([this.targetRoute]);
    }, 100);
  }

  /**
   * استخراج رسالة الخطأ
   */
  private extractErrorMessage(error: any): string {
    if (this.isHttpError(error)) {
      const status = error.status;

      if (status === 401) {
        return 'اسم المستخدم أو كلمة المرور غير صحيحة.';
      }

      if (status === 403) {
        return 'الحساب غير نشط. يرجى الاتصال بالمسؤول.';
      }

      if (status === 500) {
        return 'حدث خطأ داخلي في الخادم. حاول لاحقًا.';
      }

      const message =
        typeof error.error === 'object' &&
        error.error !== null &&
        'message' in error.error &&
        typeof error.error['message'] === 'string'
          ? (error.error['message'] as string)
          : 'فشل تسجيل الدخول.';

      return message;
    }

    return error?.error?.message || 'حدث خطأ غير متوقع.';
  }

  private isHttpError(
    error: unknown
  ): error is { status: number; error: Record<string, unknown> } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      'error' in error
    );
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  /**
   * دالة مساعدة لعرض أسماء الـ Roles في الـ template
   */
  getRoleDisplayName(role: string | null): string {
    const roleNames: { [key: string]: string } = {
      admin: 'مدير النظام',
      supervisor: 'مشرف',
      user: 'مستخدم',
      student: 'طالب',
    };

    return role ? roleNames[role] || role : 'زائر';
  }

  /**
   * دالة مساعدة للوصول إلى role المستخدم من الـ template
   */
  getUserRole(): string | null {
    return this.loginService.getUserRole();
  }

  /**
   * ✅ دالة للتحقق إذا كان المستخدم مسجل دخول (للعرض في الـ template)
   */
  isLoggedIn(): boolean {
    return (
      this.loginService.getTokenFromLocalStorage() !== null &&
      !this.loginService.isTokenExpired(
        this.loginService.getTokenFromLocalStorage()!
      )
    );
  }
}
