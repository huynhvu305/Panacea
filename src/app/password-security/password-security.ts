import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user'; // Giả định có sẵn UserService để gọi API
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-password-security',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-security.html',
  styleUrls: ['./password-security.css']
})
export class PasswordSecurityComponent implements OnInit {
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  twoFactorEnabled: boolean = false;

  // ====== NEW: UI state ======
  showCurrent = false;
  showNew = false;
  showConfirm = false;
  showTips = false;

  // ====== NEW: validation flags (bind qua getter) ======
  hasMinLength = false;
  hasLetter = false;
  hasNumber = false;
  matchConfirm = false;

  constructor(
    private userService: UserService,
    private seoService: SEOService
  ) { }

  ngOnInit(): void {
    this.seoService.updateSEO({
      title: 'Bảo Mật Mật Khẩu - Panacea',
      description: 'Cập nhật mật khẩu và bảo mật tài khoản của bạn tại Panacea',
      keywords: 'Panacea, bảo mật, mật khẩu, tài khoản, xác thực hai yếu tố'
    });
  }

  // Gọi khi gõ vào "Mật khẩu mới"
  onTypingNew(): void {
    const p = this.passwordForm.newPassword || '';
    this.hasMinLength = p.length >= 8;
    this.hasLetter = /[A-Za-z]/.test(p);
    this.hasNumber = /\d/.test(p);
    this.matchConfirm = !!this.passwordForm.confirmPassword && p === this.passwordForm.confirmPassword;
  }

  // Gọi khi gõ vào "Xác nhận"
  onTypingConfirm(): void {
    this.matchConfirm = this.passwordForm.newPassword === this.passwordForm.confirmPassword && !!this.passwordForm.confirmPassword;
  }

  toggleVisibility(field: 'new' | 'confirm'): void {
    if (field === 'new') this.showNew = !this.showNew;
    else this.showConfirm = !this.showConfirm;
  }

  toggleTips(): void { this.showTips = !this.showTips; }

  // Cho phép bấm submit khi đạt tối thiểu 3 điều kiện
  canSubmit(): boolean {
    return this.hasMinLength && this.hasLetter && this.hasNumber && this.matchConfirm && !!this.passwordForm.currentPassword;
  }

  changePassword(): void {
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm;

    // Kiểm tra đủ và đúng trước khi gọi API (SweetAlert giữ nguyên phong cách)
    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire('Thiếu thông tin', 'Vui lòng nhập đầy đủ các trường.', 'warning');
      return;
    }
    if (!this.hasMinLength) {
      Swal.fire('Mật khẩu quá ngắn', 'Mật khẩu mới phải tối thiểu 8 ký tự.', 'error');
      return;
    }
    if (!this.hasLetter || !this.hasNumber) {
      Swal.fire('Chưa đủ mạnh', 'Mật khẩu cần có ít nhất 1 chữ cái và 1 chữ số.', 'error');
      return;
    }
    if (!this.matchConfirm) {
      Swal.fire('Không khớp', 'Mật khẩu xác nhận không đúng.', 'error');
      return;
    }

    this.userService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        Swal.fire('Thành công', 'Đã đổi mật khẩu.', 'success');
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.hasMinLength = this.hasLetter = this.hasNumber = this.matchConfirm = false;
        this.showNew = this.showConfirm = this.showCurrent = false;
      },
      error: () => {
        Swal.fire('Thất bại', 'Mật khẩu hiện tại không đúng hoặc lỗi hệ thống.', 'error');
      }
    });
  }

  toggleTwoFactor(): void {
    this.twoFactorEnabled = !this.twoFactorEnabled;

    // Gọi API giả định cập nhật trạng thái 2FA
    this.userService.updateTwoFactor(this.twoFactorEnabled).subscribe({
      next: () => {
        Swal.fire('Cập nhật thành công', `Đã ${this.twoFactorEnabled ? 'bật' : 'tắt'} xác thực 2 lớp.`, 'success');
      },
      error: () => {
        Swal.fire('Lỗi', 'Không thể cập nhật trạng thái 2FA.', 'error');
        this.twoFactorEnabled = !this.twoFactorEnabled; // rollback
      }
    });
  }

  deleteAccount(): void {
    Swal.fire({
      title: 'Xác nhận xóa tài khoản?',
      text: 'Bạn sẽ không thể khôi phục lại tài khoản này.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4444',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Xóa tài khoản'
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteAccount().subscribe({
          next: () => {
            Swal.fire('Đã xóa', 'Tài khoản của bạn đã bị xóa.', 'success');
            // điều hướng ra trang login hoặc home
          },
          error: () => {
            Swal.fire('Lỗi', 'Không thể xóa tài khoản lúc này.', 'error');
          }
        });
      }
    });
  }
}
