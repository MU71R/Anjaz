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
      password: ['', [Validators.required]], // إزالة minLength و maxLength
    });
  }

  ngOnInit(): void {
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
      this.toastr.info('تم تسجيل الخروج بنجاح', 'تسجيل الخروج', {
        positionClass: 'toast-top-right',
        timeOut: 3000,
      });
      localStorage.removeItem('loggedOut');
    }

    this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = '';
      }
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  login(): void {
    if (this.loginForm.invalid) {
      Object.values(this.f).forEach((control) => {
        control.markAsTouched();
      });
      this.toastr.warning('يرجى إدخال البيانات بشكل صحيح', 'تحذير', {
        positionClass: 'toast-top-right',
        timeOut: 3000,
      });
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

          this.toastr.success(`مرحباً ${userName}!`, 'تم تسجيل الدخول بنجاح', {
            positionClass: 'toast-top-right',
            timeOut: 3000,
          });
          this.redirectToDashboard();
        } else {
          this.errorMessage = 'لم يتم استلام بيانات الدخول بشكل صحيح.';
          this.toastr.error(this.errorMessage, 'خطأ', {
            positionClass: 'toast-top-right',
            timeOut: 4000,
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.extractErrorMessage(error);
        this.toastr.error(this.errorMessage, 'فشل تسجيل الدخول', {
          positionClass: 'toast-top-right',
          timeOut: 4000,
        });
      },
    });
  }

  private redirectToDashboard(): void {
    setTimeout(() => {
      this.router.navigate([this.targetRoute]);
    }, 100);
  }

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

    return (
      error?.error?.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
    );
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

  getRoleDisplayName(role: string | null): string {
    const roleNames: { [key: string]: string } = {
      admin: 'مدير النظام',
      supervisor: 'مشرف',
      user: 'مستخدم',
      student: 'طالب',
    };

    return role ? roleNames[role] || role : 'زائر';
  }

  getUserRole(): string | null {
    return this.loginService.getUserRole();
  }

  isLoggedIn(): boolean {
    return (
      this.loginService.getTokenFromLocalStorage() !== null &&
      !this.loginService.isTokenExpired(
        this.loginService.getTokenFromLocalStorage()!
      )
    );
  }
}
