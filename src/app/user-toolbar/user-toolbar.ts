import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-user-toolbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './user-toolbar.html',
  styleUrls: ['./user-toolbar.css'],
})
export class UserToolbarComponent implements OnInit {
  currentAccount: any = null;
  membership: string = 'BRONZE PRIORITY';
  membershipClass: string = 'bronze';
  badgeUrl: string = 'https://i.imgur.com/fake-bronze.webp'; // mặc định

  sidebarOpen: boolean = false;

  constructor(public authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    // Load account từ users.json ngay khi component khởi tạo
    this.loadAccount();
    
    // Subscribe để cập nhật khi có thay đổi
    this.authService.getCurrentAccount().subscribe({
      next: (account) => {
        if (account) {
          // Đảm bảo lấy dữ liệu mới nhất từ users.json
          this.loadAccount();
        } else {
          this.currentAccount = {};
          this.setMembership(0);
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy account:', err);
        this.currentAccount = {};
        this.setMembership(0);
      },
    });
    
    // Listen cho event khi Xu được cập nhật (từ payment page)
    window.addEventListener('userPointsUpdated', (event: any) => {
      // Reload account để cập nhật số Xu mới nhất
      this.loadAccount();
    });
  }

  loadAccount(): void {
    // Luôn ưu tiên lấy dữ liệu mới nhất từ USERS list (đã được sync từ users.json)
    const usersStr = localStorage.getItem('USERS');
    const uid = localStorage.getItem('UID');
    
    if (usersStr && uid) {
      try {
        const users = JSON.parse(usersStr);
        // Tìm user trong USERS list (đã được sync từ users.json)
        const user = users.find((u: any) => u.user_id === uid);
        if (user) {
          // Cập nhật account với dữ liệu từ users.json
          this.currentAccount = {
            id: parseInt(user.user_id?.replace('US', '') || '0') || 0,
            ho_ten: user.full_name || 'User name',
            full_name: user.full_name || 'User name', // Thêm full_name để dùng trong template
            email: user.email || '',
            phone_number: user.phone_number || '',
            diem_tich_luy: user.star || 0,
            diem_kha_dung: user.coin || 0,
            coin: user.coin || 0, // Lấy từ users.json
            star: user.star || 0, // Lấy từ users.json
          };
          
          // Cập nhật membership dựa trên star từ users.json
          const star = typeof user.star === 'number' ? user.star : 0;
          this.setMembership(star);
          
          // Cập nhật lại CURRENT_USER với dữ liệu mới nhất từ users.json
          localStorage.setItem('CURRENT_USER', JSON.stringify(user));
        } else {
          // Nếu không tìm thấy trong USERS, thử lấy từ CURRENT_USER
          this.loadFromCurrentUser();
        }
      } catch (e) {
        // Nếu parse lỗi, thử lấy từ CURRENT_USER
        this.loadFromCurrentUser();
      }
    } else {
      // Nếu không có USERS hoặc UID, thử lấy từ CURRENT_USER
      this.loadFromCurrentUser();
    }
  }

  private loadFromCurrentUser(): void {
    const currentUserStr = localStorage.getItem('CURRENT_USER');
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr);
        this.currentAccount = {
          id: parseInt(user.user_id?.replace('US', '') || '0') || 0,
          ho_ten: user.full_name || 'User name',
          full_name: user.full_name || 'User name',
          email: user.email || '',
          phone_number: user.phone_number || '',
          diem_tich_luy: user.star || 0,
          diem_kha_dung: user.coin || 0,
          coin: user.coin || 0,
          star: user.star || 0,
        };
        const star = typeof user.star === 'number' ? user.star : 0;
        this.setMembership(star);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  collapseSidebar(): void {
    this.sidebarOpen = false;
  }

  openMembershipLink(): void {
    this.router.navigate(['/customer-star']);
  }

  /** Xác định cấp độ hội viên + badge (theo hình ảnh: Diamond 100 sao, Platinum 50 sao, Gold 20 sao, Silver 5 sao, Bronze 0 sao) */
  setMembership(star: number): void {
    if (star >= 100) {
      this.membership = 'DIAMOND PRIORITY';
      this.membershipClass = 'diamond';
      this.badgeUrl = '../../assets/images/ic_diamond_badge.webp';
    } else if (star >= 50) {
      this.membership = 'PLATINUM PRIORITY';
      this.membershipClass = 'platinum-20m';
      this.badgeUrl = '../../assets/images/ic_platinum_badge.webp';
    } else if (star >= 20) {
      this.membership = 'GOLD PRIORITY';
      this.membershipClass = 'gold';
      this.badgeUrl = '../../assets/images/ic_gold_badge.webp';
    } else if (star >= 5) {
      this.membership = 'SILVER PRIORITY';
      this.membershipClass = 'silver';
      this.badgeUrl = '../../assets/images/ic_silver_badge.webp';
    } else {
      this.membership = 'BRONZE PRIORITY';
      this.membershipClass = 'bronze';
      this.badgeUrl = '../../assets/images/ic_bronze_badge.webp';
    }
  }

  /** Lấy tên hạng (Diamond, Platinum, Gold, Silver, Bronze) từ membership */
  getMembershipRank(): string {
    if (this.membership.includes('DIAMOND')) {
      return 'Diamond';
    } else if (this.membership.includes('PLATINUM')) {
      return 'Platinum';
    } else if (this.membership.includes('GOLD')) {
      return 'Gold';
    } else if (this.membership.includes('SILVER')) {
      return 'Silver';
    } else {
      return 'Bronze';
    }
  }

  logout(): void {
    Swal.fire({
      title: 'Bạn có chắc chắn muốn đăng xuất?',
      text: 'Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng những ưu đãi đặc biệt!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#132fba',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.router.navigate(['']);
        Swal.fire({
          title: 'Đăng xuất thành công!',
          text: 'Hẹn gặp lại.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#132fba',
          timer: 2000,
          timerProgressBar: true,
        });
      }
    });
  }
}
