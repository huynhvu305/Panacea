import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserToolbarComponent } from '../user-toolbar/user-toolbar';
import { AuthService } from '../services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-customer-account',
  standalone: true,
  imports: [RouterModule, CommonModule, UserToolbarComponent],
  templateUrl: './customer-account.html',
  styleUrls: ['./customer-account.css']
})
export class CustomerAccountComponent implements OnInit {
  activeTab: string = 'account';

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Kiểm tra và chặn admin truy cập
    if (this.authService.isLoggedIn() && this.authService.isAdmin()) {
      Swal.fire({
        icon: 'warning',
        title: 'Không được phép truy cập',
        text: 'Tài khoản admin chỉ được truy cập vào các trang quản lý. Vui lòng sử dụng tài khoản khách hàng để truy cập trang này.',
        confirmButtonText: 'Về trang quản trị',
        allowOutsideClick: false
      }).then(() => {
        this.router.navigate(['/admin-dashboard']);
      });
      return;
    }

    this.updateActiveTab(this.router.url);
    this.router.events.subscribe((event: any) => {
      if (event.url) {
        this.updateActiveTab(event.url);
      }
    });
  }

  updateActiveTab(url: string): void {
    if (url.includes('account-information')) {
      this.activeTab = 'account';
    } else if (url.includes('password-security')) {
      this.activeTab = 'security';
    } else if (url.includes('customer-coin')) {
      this.activeTab = 'coin';
    } else if (url.includes('customer-star')) {
      this.activeTab = 'star';
    } else if (url.includes('booking-history')) {
      this.activeTab = 'history';
    } else {
      this.activeTab = '';
    }
  }
}
