import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { UserToolbarComponent } from "../user-toolbar/user-toolbar";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';

interface MembershipInfo {
  level: string;
  nextThreshold: number;
  coinsNeeded: number;
  nextLevel?: string;
}

@Component({
  selector: 'app-cus-star',
  standalone: true,
  imports: [UserToolbarComponent, CommonModule, FormsModule],
  templateUrl: './customer-star.html',
  styleUrls: ['./customer-star.css']
})
export class CustomerStarComponent implements OnInit {
  currentAccount: any;
  membershipInfo!: MembershipInfo;
  progressPercent: number = 0;
  showStarModal = false;
  currentDate: string = new Date().toLocaleDateString('vi-VN');
  benefits = [
    {
      icon: '../../assets/images/ic_bronze_badge.webp',
      title: 'Bronze – Thành viên mới (0 sao)',
      desc: `
      • Tích điểm: 1x<br>
      • Nhận voucher chào mừng 10% khi đăng ký.
    `
    },
    {
      icon: '../../assets/images/ic_silver_badge.webp',
      title: 'Silver – Thành viên Bạc (5 sao)',
      desc: `
      • Tích điểm: 1.2x<br>
      • Giảm 5% giá dịch vụ mọi ngày thường.<br>
      • Tặng voucher 100.000 VNĐ/năm.
    `
    },
    {
      icon: '../../assets/images/ic_gold_badge.webp',
      title: 'Gold – Thành viên Vàng (20 sao)',
      desc: `
      • Tích điểm: 1.5x<br>
      • Giảm 10% toàn bộ dịch vụ (kể cả cuối tuần, trừ lễ).<br>
      • Tặng voucher 200.000 VNĐ/năm.
    `
    },
    {
      icon: '../../assets/images/ic_platinum_badge.webp',
      title: 'Platinum – Thành viên Bạch kim (50 sao)',
      desc: `
      • Tích điểm: 1.8x<br>
      • Giảm 15% dịch vụ & dịch vụ đi kèm (kể cả cuối tuần, trừ lễ).<br>
      • Tặng voucher 500.000 VNĐ/năm.<br>
      • Nhận quà sinh nhật đặc biệt.
    `
    },
    {
      icon: '../../assets/images/ic_diamond_badge.webp',
      title: 'Diamond – Thành viên Kim cương (100 sao)',
      desc: `
      • Tích điểm: 2x<br>
      • Giảm 20% dịch vụ & dịch vụ đi kèm (mọi ngày trong năm).<br>
      • Tặng voucher 1.000.000 VNĐ/năm.<br>
      • Nhận quà sinh nhật đặc biệt.<br>
      • Quyền mời 1 người đi kèm miễn phí mỗi tháng.
    `
    }
  ];


  constructor(
    private authService: AuthService,
    private router: Router,
    private seoService: SEOService
  ) { }

  ngOnInit(): void {
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

    // SEO
    this.seoService.updateSEO({
      title: 'Panacea Priority - Hạng Thành Viên - Panacea',
      description: 'Xem hạng thành viên Panacea Priority của bạn - Tích điểm, lên hạng và nhận các đặc quyền độc quyền từ Bronze đến Diamond.',
      keywords: 'Panacea Priority, hạng thành viên, Bronze Silver Gold Platinum Diamond, đặc quyền thành viên',
      robots: 'noindex, nofollow'
    });
    
    this.authService.getCurrentAccount().subscribe(account => {
      const star = account?.star ?? 0;
      this.currentAccount = account;
      this.membershipInfo = this.calculateMembership(star);
      this.progressPercent = this.calcProgressPercent(star);
    });
  }

  calculateMembership(star: number): MembershipInfo {
    if (star >= 100) {
      return {
        level: 'DIAMOND',
        nextThreshold: 0,
        coinsNeeded: 0
      };
    } else if (star >= 50) {
      return {
        level: 'PLATINUM',
        nextThreshold: 100,
        coinsNeeded: 100 - star,
        nextLevel: 'DIAMOND'
      };
    } else if (star >= 20) {
      return {
        level: 'GOLD',
        nextThreshold: 50,
        coinsNeeded: 50 - star,
        nextLevel: 'PLATINUM'
      };
    } else if (star >= 5) {
      return {
        level: 'SILVER',
        nextThreshold: 20,
        coinsNeeded: 20 - star,
        nextLevel: 'GOLD'
      };
    } else {
      return {
        level: 'BRONZE',
        nextThreshold: 5,
        coinsNeeded: 5 - star,
        nextLevel: 'SILVER'
      };
    }
  }

  calcProgressPercent(star: number): number {
    const next = this.membershipInfo.nextThreshold;
    if (next === 0) return 100;

    const prev =
      this.membershipInfo.level === 'SILVER'
        ? 5
        : this.membershipInfo.level === 'GOLD'
          ? 20
          : this.membershipInfo.level === 'PLATINUM'
            ? 50
            : 0;

    return Math.min(((star - prev) / (next - prev)) * 100, 100);
  }

  getMembershipRank(): string {
    if (!this.membershipInfo) return 'Bronze';
    
    const rankMap: Record<string, string> = {
      'BRONZE': 'Bronze',
      'SILVER': 'Silver',
      'GOLD': 'Gold',
      'PLATINUM': 'Platinum',
      'DIAMOND': 'Diamond'
    };
    
    return rankMap[this.membershipInfo.level] || 'Bronze';
  }

  openLearnHow(): void {
    window.open('/support/star', '_blank');
  }

  openAboutStar(): void {
    this.showStarModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAboutStar(): void {
    this.showStarModal = false;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.showStarModal) this.closeAboutStar();
  }
}
