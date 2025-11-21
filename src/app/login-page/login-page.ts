import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import { SEOService } from '../services/seo.service';
import { catchError, EMPTY } from 'rxjs';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

export function emailOrPhoneValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = (control.value || '').toString().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?\d{6,15}$/; // hỗ trợ +84... hoặc số thuần đã chuẩn hóa
  if (!value) return { required: true };
  return emailRegex.test(value) || phoneRegex.test(value) ? null : { emailOrPhone: true };
}

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.css'],
})
export class LoginPageComponent implements OnInit, AfterViewInit {
  @ViewChild('forgotPasswordModal') forgotPasswordModalElement!: ElementRef;
  private forgotPasswordModal: any;
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  otpForm!: FormGroup;
  newPasswordForm!: FormGroup;
  isLoading = false;
  isLoadingOTP = false;
  isVerifyingOTP = false;
  isResettingPassword = false;
  forgotPasswordStep = 1;
  forgotPasswordEmailOrPhone = '';
  forgotPasswordError = '';
  otpError = '';
  private readonly OTP_CODE = '123456';

  returnUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private userService: UserService,
    private seoService: SEOService
  ) { }

  ngOnInit() {
    this.seoService.updateSEO({
      title: 'Đăng Nhập - Panacea',
      description: 'Đăng nhập vào tài khoản Panacea của bạn để quản lý đặt chỗ, xem ưu đãi và trải nghiệm các dịch vụ.',
      keywords: 'Đăng nhập Panacea, tài khoản Panacea, quản lý đặt chỗ, login',
      robots: 'noindex, nofollow'
    });
    
    window.scrollTo(0, 0);
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    this.loginForm = this.fb.group({
      emailOrPhone: ['', [Validators.required, emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.forgotPasswordForm = this.fb.group({
      emailOrPhone: ['', [Validators.required, emailOrPhoneValidator]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.newPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngAfterViewInit(): void {
    if (this.forgotPasswordModalElement) {
      this.forgotPasswordModal = new bootstrap.Modal(this.forgotPasswordModalElement.nativeElement, {
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  formatLoginInput() {
    const control = this.loginForm.get('emailOrPhone');
    if (!control) return;

    let value = control.value || '';
    const isPhoneTyping = /^(\+?\d{0,15}|\d{0,15})$/.test(value);
    if (isPhoneTyping) {
      value = value.replace(/[^0-9+]/g, '');
      if (value.startsWith('0') && value.length === 10) {
        value = '+84' + value.substring(1);
      }
      control.setValue(value, { emitEvent: false });
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    
    if (this.isLoading) {
      return;
    }
    
    const { emailOrPhone, password } = this.loginForm.value;

    this.isLoading = true;
    this.loginForm.enable();
    
    this.authService.login(emailOrPhone, password).pipe(
      catchError((err) => {
        this.isLoading = false;
        this.loginForm.enable();
        
        if (err?.message === 'wrong_password') {
          Swal.fire('Đăng nhập thất bại!', 'Email/số điện thoại hoặc mật khẩu không đúng.', 'error');
          this.loginForm.get('password')?.reset();
        } else {
          Swal.fire('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.', 'error');
        }
        return EMPTY;
      })
    ).subscribe((result) => {
      this.isLoading = false;
      this.loginForm.enable();
      
      if (result?.user?.role === 'admin' || this.authService.isAdmin()) {
        console.log('[LoginPage] User là admin, redirect tới /admin-dashboard');
        Swal.fire('Đăng nhập thành công!', '', 'success').then(() => {
          this.router.navigate(['/admin-dashboard']);
        });
      } else {
        Swal.fire('Đăng nhập thành công!', '', 'success').then(() => {
          this.router.navigate([this.returnUrl]);
        });
      }
    });
  }

  openForgotPassword(event: Event): void {
    event.preventDefault();
    this.forgotPasswordStep = 1;
    this.forgotPasswordForm.reset();
    this.forgotPasswordError = '';
    if (this.forgotPasswordModal) {
      this.forgotPasswordModal.show();
    } else if (this.forgotPasswordModalElement) {
      this.forgotPasswordModal = new bootstrap.Modal(this.forgotPasswordModalElement.nativeElement, {
        backdrop: 'static',
        keyboard: false
      });
      this.forgotPasswordModal.show();
    }
  }

  closeForgotPassword(): void {
    this.forgotPasswordStep = 1;
    this.forgotPasswordForm.reset();
    this.otpForm.reset();
    this.newPasswordForm.reset();
    this.forgotPasswordError = '';
    this.otpError = '';
    this.forgotPasswordEmailOrPhone = '';
    if (this.forgotPasswordModal) {
      this.forgotPasswordModal.hide();
    }
  }

  formatForgotPasswordInput(): void {
    const control = this.forgotPasswordForm.get('emailOrPhone');
    if (!control) return;

    let value = control.value || '';
    const isPhoneTyping = /^(\+?\d{0,15}|\d{0,15})$/.test(value);
    if (isPhoneTyping) {
      value = value.replace(/[^0-9+]/g, '');
      if (value.startsWith('0') && value.length === 10) {
        value = '+84' + value.substring(1);
      }
      control.setValue(value, { emitEvent: false });
    }
  }

  sendOTP(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    if (this.isLoadingOTP) {
      return;
    }

    const emailOrPhone = this.forgotPasswordForm.get('emailOrPhone')?.value;
    this.isLoadingOTP = true;
    this.forgotPasswordError = '';

    this.userService.findUserByEmailOrPhone(emailOrPhone).subscribe({
      next: (user) => {
        this.isLoadingOTP = false;
        if (!user) {
          this.forgotPasswordError = 'Không tìm thấy tài khoản với email/số điện thoại này.';
          return;
        }

        this.forgotPasswordEmailOrPhone = emailOrPhone;
        this.forgotPasswordStep = 2;
        this.otpForm.reset();
        this.otpError = '';
        
        Swal.fire({
          icon: 'success',
          title: 'Đã gửi mã OTP',
          text: `Mã OTP đã được gửi đến ${emailOrPhone}.`,
          confirmButtonColor: '#132fba',
        });
      },
      error: (err) => {
        this.isLoadingOTP = false;
        this.forgotPasswordError = 'Không tìm thấy tài khoản với email/số điện thoại này.';
      }
    });
  }

  onOTPInput(): void {
    const otpControl = this.otpForm.get('otp');
    if (otpControl) {
      let value = otpControl.value.replace(/\D/g, '');
      if (value.length > 6) {
        value = value.substring(0, 6);
      }
      otpControl.setValue(value, { emitEvent: false });
    }
  }

  verifyOTP(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    if (this.isVerifyingOTP) {
      return;
    }

    const otp = this.otpForm.get('otp')?.value;
    this.isVerifyingOTP = true;
    this.otpError = '';

    if (otp === this.OTP_CODE) {
      this.isVerifyingOTP = false;
      this.forgotPasswordStep = 3;
      this.newPasswordForm.reset();
      Swal.fire({
        icon: 'success',
        title: 'Xác thực thành công',
        text: 'Mã OTP đúng. Vui lòng đặt mật khẩu mới.',
        confirmButtonColor: '#132fba',
      });
    } else {
      this.isVerifyingOTP = false;
      this.otpError = 'Mã OTP không đúng. Vui lòng thử lại.';
      this.otpForm.get('otp')?.reset();
    }
  }

  resetPassword(): void {
    if (this.newPasswordForm.invalid) {
      this.newPasswordForm.markAllAsTouched();
      return;
    }

    if (this.isResettingPassword) {
      return;
    }

    const { newPassword, confirmPassword } = this.newPasswordForm.value;

    if (newPassword !== confirmPassword) {
      Swal.fire('Lỗi', 'Mật khẩu xác nhận không khớp.', 'error');
      return;
    }

    this.isResettingPassword = true;

    this.userService.resetPassword(this.forgotPasswordEmailOrPhone, newPassword).subscribe({
      next: () => {
        this.isResettingPassword = false;
        Swal.fire({
          icon: 'success',
          title: 'Đặt lại mật khẩu thành công',
          text: 'Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.',
          confirmButtonColor: '#132fba',
        }).then(() => {
          this.closeForgotPassword();
        });
      },
      error: (err) => {
        this.isResettingPassword = false;
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: err?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.',
          confirmButtonColor: '#132fba',
        });
      }
    });
  }
}
