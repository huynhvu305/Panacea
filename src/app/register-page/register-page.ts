import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  FormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Router, RouterModule } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { UserService } from '../services/user';
import { SEOService } from '../services/seo.service';

// Custom validator để so sánh mật khẩu
export function MustMatch(controlName: string, matchingControlName: string) {
  return (formGroup: AbstractControl) => {
    const control = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);
    if (!control || !matchingControl) {
      return null;
    }
    if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
      return null;
    }
    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ mustMatch: true });
    } else {
      matchingControl.setErrors(null);
    }
    return null;
  };
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterModule],
  templateUrl: './register-page.html',
  styleUrls: ['./register-page.css'],
})
export class RegisterPageComponent implements OnInit {
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private userService: UserService,
    private seoService: SEOService
  ) { }

  ngOnInit() {
    // SEO
    this.seoService.updateSEO({
      title: 'Đăng Ký Tài Khoản - Panacea',
      description: 'Đăng ký tài khoản Panacea ngay hôm nay để nhận voucher chào mừng -10% và bắt đầu hành trình chữa lành tâm hồn.',
      keywords: 'Đăng ký Panacea, tạo tài khoản Panacea, đăng ký thành viên Panacea',
      robots: 'noindex, nofollow'
    });
    
    window.scrollTo(0, 0);
    
    this.registerForm = this.fb.group(
      {
        full_name: [
          '',
          [Validators.required, Validators.pattern('^[a-zA-ZÀ-ỹ ]+$')],
        ],
        email: [
          '',
          [
            Validators.required,
            Validators.pattern(
              '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
            ),
          ],
        ],
        phone_number: [
          '',
          [
            Validators.required,
            Validators.pattern('^(\\+\\d{1,2})?\\d{10,16}$'),
          ],
        ],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm_password: ['', Validators.required],
      },
      { validators: MustMatch('password', 'confirm_password') }
    );
  }

  formatPhoneNumber() {
    let phoneControl = this.registerForm.get('phone_number');
    if (!phoneControl) return;
    let phoneValue = phoneControl.value || '';
    phoneValue = phoneValue.replace(/[^0-9+]/g, '');
    if (phoneValue.startsWith('0') && phoneValue.length === 10) {
      phoneValue = '+84' + phoneValue.substring(1);
    } else if (
      !phoneValue.startsWith('0') &&
      !phoneValue.startsWith('+') &&
      phoneValue.length >= 9 &&
      phoneValue.length <= 15
    ) {
      phoneValue = '+84' + phoneValue;
    } else if (phoneValue.startsWith('+')) {
      let countryCodeMatch = phoneValue.match(/^(\+\d{1,3})(\d{6,14})$/);
      if (countryCodeMatch) {
        let countryCode = countryCodeMatch[1];
        let mainNumber = countryCodeMatch[2];
        phoneValue = `${countryCode}${mainNumber}`;
      }
    }
    phoneControl.setValue(phoneValue, { emitEvent: false });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    
    // Đảm bảo form luôn có thể nhập
    this.registerForm.enable();
    
    const formData = this.registerForm.value;
    const payload: Partial<any> = {
      full_name: formData.full_name,
      email: formData.email,
      phone_number: formData.phone_number,
      password: formData.password,
    };

    this.userService
      .register(payload)
      .pipe(
        catchError((error) => {
          // Đảm bảo form có thể nhập lại khi có lỗi
          this.registerForm.enable();
          
          let errorMessage = '';
          if (error.errors) {
            // Nếu có object errors từ backend
            if (error.errors.email && error.errors.phone_number) {
              errorMessage = 'Email và số điện thoại đã được sử dụng!';
              Swal.fire({
                title: errorMessage,
                text: 'Bạn muốn đăng nhập bằng thông tin này hay sử dụng thông tin khác?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Đăng nhập',
                cancelButtonText: 'Sử dụng thông tin khác',
              }).then((result) => {
                if (result.isConfirmed) {
                  this.router.navigate(['/login']);
                } else {
                  this.registerForm.get('email')?.reset();
                  this.registerForm.get('phone_number')?.reset();
                }
              });
            } else if (error.errors.email) {
              errorMessage = 'Email đã được sử dụng!';
              Swal.fire({
                title: errorMessage,
                text: 'Bạn muốn đăng nhập bằng email này hay sử dụng email khác?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Đăng nhập',
                cancelButtonText: 'Sử dụng email khác',
              }).then((result) => {
                if (result.isConfirmed) {
                  this.router.navigate(['/login']);
                } else {
                  this.registerForm.get('email')?.reset();
                }
              });
            } else if (error.errors.phone_number) {
              errorMessage = 'Số điện thoại đã được sử dụng!';
              Swal.fire({
                title: errorMessage,
                text: 'Bạn muốn đăng nhập bằng số điện thoại này hay sử dụng số khác?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Đăng nhập',
                cancelButtonText: 'Sử dụng số khác',
              }).then((result) => {
                if (result.isConfirmed) {
                  this.router.navigate(['/login']);
                } else {
                  this.registerForm.get('phone_number')?.reset();
                }
              });
            }
          } else {
            Swal.fire({
              title: 'Đăng ký thất bại!',
              text: 'Có lỗi xảy ra, vui lòng thử lại.',
              icon: 'error',
              confirmButtonText: 'Thử lại',
            });
          }
          return EMPTY;
        })
      )
      .subscribe({
        next: (response: any) => {
          this.registerForm.enable();
          Swal.fire({
            title: 'Đăng ký thành công!',
            text: 'Bạn sẽ được chuyển hướng để đăng nhập.',
            icon: 'success',
            confirmButtonText: 'OK',
          }).then(() => {
            this.router.navigate(['/login']);
          });
        },
        error: () => {
          this.registerForm.enable();
          // Không log lỗi ra console
        },
      });
  }
}