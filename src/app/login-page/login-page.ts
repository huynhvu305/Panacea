import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth';
import { SEOService } from '../services/seo.service';
import { catchError, EMPTY } from 'rxjs';
import { CommonModule } from '@angular/common';

export function emailOrPhoneValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = (control.value || '').toString().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?\d{6,15}$/; // hỗ trợ +84... hoặc số thuần đã chuẩn hóa
  if (!value) return { required: true };
  return emailRegex.test(value) || phoneRegex.test(value) ? null : { emailOrPhone: true };
}

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule], // <-- thêm ReactiveFormsModule và RouterModule
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.css'],
})
export class LoginPageComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;

  returnUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private seoService: SEOService
  ) { }

  ngOnInit() {
    // SEO
    this.seoService.updateSEO({
      title: 'Đăng Nhập - Panacea',
      description: 'Đăng nhập vào tài khoản Panacea của bạn để quản lý đặt chỗ, xem ưu đãi và trải nghiệm các dịch vụ.',
      keywords: 'Đăng nhập Panacea, tài khoản Panacea, quản lý đặt chỗ, login',
      robots: 'noindex, nofollow'
    });
    
    // Scroll to top khi vào trang
    window.scrollTo(0, 0);
    
    // Lấy returnUrl từ query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    this.loginForm = this.fb.group({
      emailOrPhone: ['', [Validators.required, emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  formatLoginInput() {
    const control = this.loginForm.get('emailOrPhone');
    if (!control) return;

    let value = control.value || '';
    // Nếu là chuỗi số, chuẩn hóa thành E.164 (+84...) để match data
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
      return; // Tránh submit nhiều lần
    }
    
    const { emailOrPhone, password } = this.loginForm.value;

    this.isLoading = true;
    // Đảm bảo form vẫn có thể tương tác
    this.loginForm.enable();
    
    this.authService.login(emailOrPhone, password).pipe(
      catchError((err) => {
        this.isLoading = false;
        this.loginForm.enable(); // Đảm bảo form có thể nhập lại
        
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
      
      // Kiểm tra nếu user là admin, tự động redirect tới /admin-dashboard
      if (result?.user?.role === 'admin' || this.authService.isAdmin()) {
        console.log('[LoginPage] User là admin, redirect tới /admin-dashboard');
        Swal.fire('Đăng nhập thành công!', '', 'success').then(() => {
          this.router.navigate(['/admin-dashboard']);
        });
      } else {
        // Navigate đến returnUrl sau khi đăng nhập thành công (nếu không phải admin)
      Swal.fire('Đăng nhập thành công!', '', 'success').then(() => {
        this.router.navigate([this.returnUrl]);
      });
      }
    });
  }
}
