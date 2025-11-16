import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../interfaces/user';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';
import { take } from 'rxjs/operators';

@Component({
  selector: 'account-information',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-information.html',
  styleUrls: ['./account-information.css'],
})
export class AccountInformationComponent implements OnInit {
  user: User | null = null;
  editableUser: User | null = null;
  isEditing = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private seoService: SEOService
  ) { }

  ngOnInit(): void {
    // SEO
    this.seoService.updateSEO({
      title: 'Thông Tin Tài Khoản - Panacea',
      description: 'Quản lý thông tin tài khoản của bạn tại Panacea - Cập nhật thông tin cá nhân, địa chỉ và liên hệ.',
      keywords: 'Thông tin tài khoản Panacea, quản lý tài khoản, cập nhật thông tin',
      robots: 'noindex, nofollow'
    });
    /** Lấy User từ localStorage thay vì Account */
    const currentUserStr = localStorage.getItem('CURRENT_USER');
    if (currentUserStr) {
      try {
        const user: User = JSON.parse(currentUserStr);
        this.user = structuredClone(user);
        this.editableUser = structuredClone(user);
        (this.editableUser as any).gender = this.toViGender(this.editableUser?.gender as any);
      } catch (err) {
        console.error('Lỗi khi parse user từ localStorage:', err);
      }
    } else {
      console.warn('Không tìm thấy tài khoản đăng nhập');
    }
  }

  enableEdit(): void {
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.editableUser = structuredClone(this.user);
    this.isEditing = false;
  }

  saveChanges(): void {
    if (!this.editableUser) return;

    /** Chuẩn hóa định dạng ngày sinh dd-mm-yyyy */
    if (this.editableUser.birthdate) {
      const parts = this.editableUser.birthdate.split(/[-/]/);
      if (parts.length === 3 && parts[0].length === 4) {
        // yyyy-mm-dd → dd-mm-yyyy
        this.editableUser.birthdate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const payload = structuredClone(this.editableUser);
      (payload as any).gender = this.fromViGender(this.editableUser.gender as any);
    }

    this.userService.updateUserInfo(this.editableUser).subscribe({
      next: (res) => {
        this.user = structuredClone(this.editableUser);
        this.isEditing = false;

        Swal.fire({
          icon: 'success',
          title: 'Cập nhật thành công!',
          text: 'Thông tin tài khoản của bạn đã được lưu lại.',
          confirmButtonColor: '#132fba',
        });
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật:', err);
        Swal.fire({
          icon: 'error',
          title: 'Cập nhật thất bại',
          text: 'Đã xảy ra lỗi trong quá trình lưu thông tin.',
          confirmButtonColor: '#132fba',
        });
      },
    });
  }

  private toViGender(code?: string): 'Nam' | 'Nữ' | 'Khác' | '' {
    switch ((code || '').toLowerCase()) {
      case 'male': return 'Nam';
      case 'female': return 'Nữ';
      case 'other': return 'Khác';
      default: return '';
    }
  }

  private fromViGender(label?: string): 'male' | 'female' | 'other' | '' {
    switch ((label || '').toLowerCase()) {
      case 'nam': return 'male';
      case 'nữ':  // fallback for 'nu' if không dấu
      case 'nu': return 'female';
      case 'khác':
      case 'khac': return 'other';
      default: return '';
    }
  }
}
