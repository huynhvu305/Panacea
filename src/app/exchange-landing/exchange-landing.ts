import { Component, OnInit, OnDestroy, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import vouchersData from '../../assets/data/voucher.json';
import itemsData from '../../assets/data/items.json';
import { Voucher } from '../interfaces/voucher';
import { Items } from '../interfaces/items';
import { InvoiceService } from '../services/invoice';
import { UserService } from '../services/user';
import { AuthService } from '../services/auth';
import { SEOService } from '../services/seo.service';

@Component({
  selector: 'app-exchange-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './exchange-landing.html',
  styleUrls: ['./exchange-landing.css']
})
export class ExchangeLanding implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private observers: IntersectionObserver[] = [];

  constructor(
    private http: HttpClient,
    private invoiceService: InvoiceService,
    private userService: UserService,
    private authService: AuthService,
    private seoService: SEOService
  ) {}

  // ===== DỮ LIỆU NGƯỜI DÙNG =====
  userPoints: number = 0;
  currentUser: any = null;
  isLoggedIn: boolean = false;

  // ===== DỮ LIỆU VOUCHER & ITEM =====
  vouchers: Voucher[] = (vouchersData as any[]).map(v => ({ ...v, status: v.status || 'Còn hiệu lực' }));
  items: Items[] = itemsData as Items[];
  
  // ===== BỘ LỌC & TÌM KIẾM =====
  searchQuery: string = '';
  selectedCategory: string = 'all';
  pointsSort: string = 'none';
  nameSort: string = 'none';
  pointsFilter: string = 'all';
  filteredVouchers: Voucher[] = [];
  filteredItems: Items[] = [];
  
  // ===== LIGHTBOX (Xem ảnh phóng to) =====
  lightboxImage: string | null = null;
  lightboxTitle: string = '';

  // ===== DANH SÁCH TỈNH & HUYỆN =====
  provinces = [
    { name: 'TP. Hồ Chí Minh', districts: ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 7', 'TP. Thủ Đức'] },
    { name: 'Hà Nội', districts: ['Hoàn Kiếm', 'Cầu Giấy', 'Hà Đông', 'Nam Từ Liêm'] },
    { name: 'Đà Nẵng', districts: ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn'] },
    { name: 'Cần Thơ', districts: ['Ninh Kiều', 'Bình Thủy', 'Cái Răng'] },
    { name: 'Bình Dương', districts: ['Thủ Dầu Một', 'Dĩ An', 'Thuận An'] }
  ];

  // ===== LANDING PAGE DATA =====
  features = [
    {
      icon: 'bi-coin',
      title: 'Tích xu dễ dàng',
      description: '1.000 VNĐ = 1 Xu. Tích xu mỗi khi sử dụng dịch vụ tại Panacea.'
    },
    {
      icon: 'bi-ticket-perforated',
      title: 'Voucher hấp dẫn',
      description: 'Đổi voucher giảm giá với mức xu phù hợp. Từ 10% đến 30% cho các dịch vụ.'
    },
    {
      icon: 'bi-gift',
      title: 'Quà tặng độc quyền',
      description: 'Đổi các vật phẩm Panacea độc quyền như balo, ly giữ nhiệt, áo thun và nhiều hơn nữa.'
    }
  ];

  howItWorks = [
    {
      step: 1,
      icon: 'bi-calendar-check',
      title: 'Đặt dịch vụ',
      description: 'Đặt phòng hoặc dịch vụ tại Panacea và tích xu tự động.'
    },
    {
      step: 2,
      icon: 'bi-coin',
      title: 'Tích lũy xu',
      description: 'Mỗi 1.000 VNĐ chi tiêu = 1 Xu. Xu sẽ được cộng vào tài khoản của bạn.'
    },
    {
      step: 3,
      icon: 'bi-ticket-perforated',
      title: 'Đổi quà',
      description: 'Sử dụng Xu để đổi voucher giảm giá hoặc vật phẩm độc quyền.'
    }
  ];


  faqs = [
    {
      question: 'Làm thế nào để tích xu?',
      answer: 'Bạn tích xu tự động khi đặt phòng hoặc sử dụng dịch vụ tại Panacea. Mỗi 1.000 VNĐ chi tiêu = 1 Xu.',
      isOpen: false
    },
    {
      question: 'Xu có hết hạn không?',
      answer: 'Xu không hết hạn. Bạn có thể tích lũy và sử dụng bất cứ lúc nào.',
      isOpen: false
    },
    {
      question: 'Có thể chuyển xu cho người khác không?',
      answer: 'Xu không thể chuyển nhượng. Chỉ có thể sử dụng trong tài khoản của bạn.',
      isOpen: false
    },
    {
      question: 'Thời gian giao hàng vật phẩm là bao lâu?',
      answer: 'Vật phẩm sẽ được gửi trong 3-5 ngày làm việc sau khi đổi thành công. Miễn phí ship trong TP.HCM.',
      isOpen: false
    }
  ];

  toggleFaq(index: number): void {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }

  scrollToExchange(): void {
    const element = document.getElementById('exchange-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngOnInit(): void {
    // SEO - Set title ngay lập tức
    this.seoService.updateSEO({
      title: 'Ưu Đãi & Khuyến Mãi - Panacea',
      description: 'Khám phá các ưu đãi và khuyến mãi đặc biệt tại Panacea - Voucher, combo tiết kiệm và nhiều ưu đãi hấp dẫn khác.',
      keywords: 'Ưu đãi Panacea, khuyến mãi Panacea, voucher Panacea, combo Panacea',
      image: '/assets/images/BACKGROUND.webp'
    });
    
    this.loadUserData();
    this.checkVoucherStatus();
    this.filteredVouchers = [...this.vouchers];
    this.filteredItems = [...this.items];
    this.applyFilters();
    
    this.authService.getCurrentAccount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          if (account) {
            this.loadUserData();
          } else {
            this.userPoints = 0;
            this.isLoggedIn = false;
            this.currentUser = null;
          }
        },
        error: () => {
          this.userPoints = 0;
          this.isLoggedIn = false;
          this.currentUser = null;
        }
      });
  }

  ngAfterViewInit(): void {
    // Delay để đảm bảo DOM đã render
    setTimeout(() => {
      this.setupScrollReveal();
    }, 100);
  }

  ngOnDestroy(): void {
    // Cleanup observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupScrollReveal(): void {
    // Xóa các observer cũ trước khi tạo mới (tránh duplicate)
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Unobserve sau khi đã animate để tối ưu performance
          observer.unobserve(entry.target);
        }
      });
    }, options);

    // Tìm tất cả các elements cần animate (chỉ observe những element chưa được revealed)
    const elementsToReveal = document.querySelectorAll('.scroll-reveal:not(.revealed)');
    elementsToReveal.forEach(el => {
      observer.observe(el);
    });

    this.observers.push(observer);
  }

  // Copy tất cả methods từ Exchange component
  loadUserData(): void {
    const usersStr = localStorage.getItem('USERS');
    const uid = localStorage.getItem('UID');
    
    if (usersStr && uid) {
      try {
        const users = JSON.parse(usersStr);
        const user = users.find((u: any) => u.user_id === uid);
        
        if (user) {
          this.currentUser = user;
          this.isLoggedIn = true;
          this.userPoints = user.coin || 0;
        } else {
          this.userPoints = 0;
          this.isLoggedIn = false;
        }
      } catch (e) {
        this.loadFromCurrentUser();
      }
    } else {
      this.loadFromCurrentUser();
    }
  }

  private loadFromCurrentUser(): void {
    const currentUserStr = localStorage.getItem('CURRENT_USER');
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr);
        this.currentUser = user;
        this.isLoggedIn = true;
        this.userPoints = user.coin || 0;
      } catch (e) {
        this.userPoints = 0;
        this.isLoggedIn = false;
      }
    } else {
      this.userPoints = 0;
      this.isLoggedIn = false;
    }
  }

  private updateUserCoin(newCoin: number): void {
    const usersStr = localStorage.getItem('USERS');
    const uid = localStorage.getItem('UID');
    
    if (usersStr && uid) {
      try {
        const users = JSON.parse(usersStr);
        const userIndex = users.findIndex((u: any) => u.user_id === uid);
        
        if (userIndex !== -1) {
          // Cập nhật cả coin và point
          users[userIndex].coin = newCoin;
          users[userIndex].point = newCoin;
          localStorage.setItem('USERS', JSON.stringify(users));
          console.log('Đã cập nhật Xu trong USERS list:', newCoin);
        }
      } catch (e) {
        console.error('Error updating user coin:', e);
      }
    }
    
    // Cập nhật CURRENT_USER ngay lập tức
    if (this.currentUser) {
      this.currentUser.coin = newCoin;
      this.currentUser.point = newCoin;
      localStorage.setItem('CURRENT_USER', JSON.stringify(this.currentUser));
      console.log('Đã cập nhật CURRENT_USER:', newCoin);
    }
    
    // Dispatch custom event để user-toolbar refresh ngay lập tức
    window.dispatchEvent(new CustomEvent('userPointsUpdated', { 
      detail: { points: newCoin } 
    }));
  }

  checkVoucherStatus(): void {
    const today = new Date().toISOString().split('T')[0];
    this.vouchers.forEach(v => {
      if (v.startDate && v.endDate) {
        v.status = v.startDate <= today && today <= v.endDate ? 'Còn hiệu lực' : 'Hết hạn';
      } else {
        v.status = 'Còn hiệu lực';
      }
    });
  }

  async redeemVoucher(v: Voucher): Promise<void> {
    if (v.status === 'Hết hạn') {
      await Swal.fire({
        icon: 'warning',
        title: 'Voucher đã hết hạn',
        text: 'Vui lòng chọn voucher khác.',
        confirmButtonColor: '#132fba'
      });
      return;
    }

    if (this.userPoints < v.pointsRequired) {
      await Swal.fire({
        icon: 'error',
        title: 'Không đủ xu!',
        text: `Bạn cần thêm ${v.pointsRequired - this.userPoints} xu để đổi voucher này.`,
        confirmButtonColor: '#132fba'
      });
      return;
    }

    const confirmRes = await Swal.fire({
      icon: 'question',
      title: 'Xác nhận đổi voucher?',
      html: `
        <p>Voucher: <b>${v.type}</b></p>
        <p>Xu cần đổi: <b>${v.pointsRequired.toLocaleString()}</b></p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Huỷ',
      confirmButtonColor: '#132fba',
      cancelButtonColor: '#6c757d'
    });

    if (!confirmRes.isConfirmed) return;

    // Trừ Xu ngay lập tức TRƯỚC KHI hiển thị popup
    this.userPoints -= v.pointsRequired;
    
    // Lưu exchange vào lịch sử NGAY LẬP TỨC
    const uid = localStorage.getItem('UID');
    const exchangeRecord = {
      id: `EXCH_${Date.now()}`,
      userId: uid || this.currentUser?.user_id || null,
      date: new Date().toLocaleDateString('vi-VN'),
      type: 'voucher',
      voucherType: v.type,
      amount: v.pointsRequired,
      description: `Đổi voucher ${v.type}`,
      code: v.code
    };
    
    const exchangesStr = localStorage.getItem('COIN_EXCHANGES');
    let exchanges: any[] = [];
    if (exchangesStr) {
      try {
        exchanges = JSON.parse(exchangesStr);
      } catch (e) {
        console.warn('Không thể parse COIN_EXCHANGES:', e);
      }
    }
    exchanges.push(exchangeRecord);
    localStorage.setItem('COIN_EXCHANGES', JSON.stringify(exchanges));
    
    // Cập nhật vào localStorage và header NGAY LẬP TỨC
    if (this.isLoggedIn && this.currentUser) {
      this.updateUserCoin(this.userPoints);
    }
    
    const code = v.code;

    await Swal.fire({
      icon: 'success',
      title: 'Đổi voucher thành công!',
      html: `
        <p>Bạn đã đổi voucher <b>${v.type}</b>.</p>
        <div style="margin-top:16px;margin-bottom:8px;font-weight:500;color:#333;">Mã voucher của bạn:</div>
        <div style="
          margin-top:8px;display:inline-flex;align-items:center;gap:10px;
          background:linear-gradient(135deg, #132fba 0%, #4b6fff 100%);color:#fff;
          padding:12px 20px;border-radius:12px;box-shadow:0 4px 12px rgba(19,47,186,0.3);">
          <span style="font-weight:700;letter-spacing:1px;font-size:16px;">${code}</span>
          <button id="copyCodeBtn" style="
            border:none;border-radius:8px;background:rgba(255,255,255,0.2);color:#fff;
            padding:6px 10px;cursor:pointer;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;">
            <i class="bi bi-clipboard" style="font-size:16px;"></i>
          </button>
        </div>
        <style>
          #copyCodeBtn:hover {
            background:rgba(255,255,255,0.3) !important;
            transform:scale(1.05);
          }
        </style>
      `,
      confirmButtonText: 'OK',
      confirmButtonColor: '#132fba',
      didOpen: () => {
        const btn = document.getElementById('copyCodeBtn');
        btn?.addEventListener('click', () => {
          navigator.clipboard.writeText(code);
          Swal.fire({
            toast: true,
            position: 'top',
            icon: 'success',
            title: 'Đã sao chép mã',
            showConfirmButton: false,
            timer: 1500
          });
        });
      }
    });
  }

  async redeemItem(item: Items): Promise<void> {
    if (this.userPoints < item.pointsRequired) {
      await Swal.fire({
        icon: 'error',
        title: 'Không đủ xu!',
        text: `Bạn cần thêm ${item.pointsRequired - this.userPoints} xu để đổi vật phẩm này.`,
        confirmButtonColor: '#132fba'
      });
      return;
    }

    const htmlForm = `
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <div class="container-fluid px-2" style="max-width: 460px; text-align:left; font-size:15px;">
        <div class="mb-3">
          <label for="f_address" class="form-label fw-medium">Địa chỉ (số nhà, đường...)</label>
          <input type="text" id="f_address" class="form-control" placeholder="VD: 12 Nguyễn Huệ, P.Bến Nghé">
        </div>
        <div class="mb-3">
          <label for="f_province" class="form-label fw-medium">Tỉnh / Thành phố</label>
          <select id="f_province" class="form-select">
            <option value="">-- Chọn Tỉnh / Thành phố --</option>
            ${this.provinces.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="mb-3">
          <label for="f_district" class="form-label fw-medium">Quận / Huyện</label>
          <select id="f_district" class="form-select">
            <option value="">-- Chọn Quận / Huyện --</option>
          </select>
        </div>
        <div class="mb-3">
          <label for="f_name" class="form-label fw-medium">Họ và tên</label>
          <input type="text" id="f_name" class="form-control" placeholder="Nguyễn Văn A">
        </div>
        <div class="mb-3">
          <label for="f_phone" class="form-label fw-medium">Số điện thoại</label>
          <input type="text" id="f_phone" class="form-control" placeholder="09xxxxxxxx">
        </div>
        <div id="ship_msg" class="fw-medium text-secondary mt-2"></div>
      </div>
    `;

    const result = await Swal.fire({
      icon: 'question',
      title: `Đổi vật phẩm "${item.name}"?`,
      html: htmlForm,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Gửi thông tin',
      cancelButtonText: 'Huỷ',
      confirmButtonColor: '#132fba',
      cancelButtonColor: '#6c757d',
      didOpen: () => {
        const provinceSelect = document.getElementById('f_province') as HTMLSelectElement;
        const districtSelect = document.getElementById('f_district') as HTMLSelectElement;
        const shipMsg = document.getElementById('ship_msg') as HTMLElement;

        provinceSelect.addEventListener('change', () => {
          const selected = this.provinces.find(p => p.name === provinceSelect.value);
          
          districtSelect.textContent = '';
          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = '-- Chọn Quận / Huyện --';
          districtSelect.appendChild(defaultOption);
          
          (selected?.districts || []).forEach(d => {
            const option = document.createElement('option');
            option.value = d;
            option.textContent = d;
            districtSelect.appendChild(option);
          });

          if (!provinceSelect.value) {
            shipMsg.textContent = '';
            return;
          }

          shipMsg.textContent = '';
          const alertDiv = document.createElement('div');
          alertDiv.className = 'alert d-flex align-items-center p-2 mb-0';
          alertDiv.setAttribute('role', 'alert');
          
          if (provinceSelect.value === 'TP. Hồ Chí Minh') {
            alertDiv.classList.add('alert-success');
            alertDiv.style.cssText = 'background-color:#e9fbee; border:1px solid #b8e5c5; color:#117a53; border-radius:6px; margin-top:6px;';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input me-2';
            checkbox.checked = true;
            checkbox.disabled = true;
            alertDiv.appendChild(checkbox);
            
            const textDiv = document.createElement('div');
            const strong = document.createElement('strong');
            strong.textContent = 'Miễn phí ship trong TP.HCM.';
            textDiv.appendChild(strong);
            alertDiv.appendChild(textDiv);
          } else {
            alertDiv.classList.add('alert-warning');
            alertDiv.style.cssText = 'background-color:#fff9e8; border:1px solid #f2d98b; color:#946200; border-radius:6px; margin-top:6px;';
            
            const emojiDiv = document.createElement('div');
            emojiDiv.className = 'me-2';
            emojiDiv.textContent = '🚚';
            alertDiv.appendChild(emojiDiv);
            
            const textDiv = document.createElement('div');
            const strong = document.createElement('strong');
            strong.textContent = 'Phí ship 30.000đ (ngoài TP.HCM).';
            textDiv.appendChild(strong);
            alertDiv.appendChild(textDiv);
          }
          
          shipMsg.appendChild(alertDiv);
        });
      },
      preConfirm: () => {
        const address = (document.getElementById('f_address') as HTMLInputElement)?.value?.trim();
        const province = (document.getElementById('f_province') as HTMLSelectElement)?.value?.trim();
        const district = (document.getElementById('f_district') as HTMLSelectElement)?.value?.trim();
        const name = (document.getElementById('f_name') as HTMLInputElement)?.value?.trim();
        const phone = (document.getElementById('f_phone') as HTMLInputElement)?.value?.trim();

        if (!address || !province || !district || !name || !phone) {
          Swal.showValidationMessage('Vui lòng điền đầy đủ tất cả các trường.');
          return false;
        }
        if (phone.length < 9) {
          Swal.showValidationMessage('Số điện thoại không hợp lệ.');
          return false;
        }
        return { address, province, district, name, phone };
      }
    });

    if (!result.isConfirmed || !result.value) return;

    const confirmRes = await Swal.fire({
      icon: 'question',
      title: 'Xác nhận đổi vật phẩm?',
      html: `<p>Bạn chắc chắn muốn đổi <b>${item.name}</b>?</p>
       <p>Xu cần đổi: <b>${item.pointsRequired.toLocaleString()}</b></p>`,
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Huỷ',
      confirmButtonColor: '#132fba',
      cancelButtonColor: '#6c757d'
    });

    if (!confirmRes.isConfirmed) return;

    // Trừ Xu ngay lập tức TRƯỚC KHI hiển thị popup
    this.userPoints -= item.pointsRequired;
    
    // Lưu exchange vào lịch sử NGAY LẬP TỨC
    const uid = localStorage.getItem('UID');
    const exchangeRecord = {
      id: `EXCH_${Date.now()}`,
      userId: uid || this.currentUser?.user_id || null,
      date: new Date().toLocaleDateString('vi-VN'),
      type: 'item',
      itemName: item.name,
      amount: item.pointsRequired,
      description: `Đổi ${item.name}`,
      address: result.value.address,
      province: result.value.province,
      district: result.value.district,
      name: result.value.name,
      phone: result.value.phone
    };
    
    const exchangesStr = localStorage.getItem('COIN_EXCHANGES');
    let exchanges: any[] = [];
    if (exchangesStr) {
      try {
        exchanges = JSON.parse(exchangesStr);
      } catch (e) {
        console.warn('Không thể parse COIN_EXCHANGES:', e);
      }
    }
    exchanges.push(exchangeRecord);
    localStorage.setItem('COIN_EXCHANGES', JSON.stringify(exchanges));
    
    // Cập nhật vào localStorage và header NGAY LẬP TỨC
    if (this.isLoggedIn && this.currentUser) {
      this.updateUserCoin(this.userPoints);
    }
    
    const isHCM = result.value.province === 'TP. Hồ Chí Minh';
    const feeText = isHCM ? 'Miễn phí ship trong TP.HCM' : 'Phí ship 30.000đ';

    await Swal.fire({
      icon: 'success',
      title: 'Đổi quà thành công!',
      html: `
        <div class="text-start">
          <p><b>Vật phẩm:</b> ${item.name}</p>
          <p><b>Người nhận:</b> ${result.value.name}</p>
          <p><b>Địa chỉ:</b> ${result.value.address}, ${result.value.district}, ${result.value.province}</p>
          <p><b>SĐT:</b> ${result.value.phone}</p>
          <p><b>Chi phí:</b> ${feeText}</p>
          <p><b>Thời gian: </b>Quà sẽ được gửi trong 3-5 ngày làm việc.</p>
        </div>
      `,
      confirmButtonColor: '#0f89f3'
    });
  }


  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  }

  // ===== LIGHTBOX (Xem ảnh phóng to) =====
  openLightbox(imageSrc: string, title: string): void {
    this.lightboxImage = imageSrc;
    this.lightboxTitle = title;
    document.body.style.overflow = 'hidden'; // Ngăn scroll khi lightbox mở
  }

  closeLightbox(): void {
    this.lightboxImage = null;
    this.lightboxTitle = '';
    document.body.style.overflow = ''; // Khôi phục scroll
  }

  // Đóng lightbox khi click vào overlay (ngoài ảnh)
  onLightboxOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeLightbox();
    }
  }

  // Đóng lightbox khi nhấn phím ESC
  @HostListener('document:keydown', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.lightboxImage) {
      this.closeLightbox();
    }
  }

  applyFilters(): void {
    let vFiltered = [...this.vouchers];
    
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      vFiltered = vFiltered.filter(v => 
        v.type.toLowerCase().includes(query) ||
        v.code.toLowerCase().includes(query)
      );
    }
    
    if (this.pointsFilter !== 'all') {
      vFiltered = vFiltered.filter(v => this.matchesPointsFilter(v.pointsRequired));
    }
    
    vFiltered = this.sortItems(vFiltered, 'voucher');
    this.filteredVouchers = vFiltered;
    
    let iFiltered = [...this.items];
    
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      iFiltered = iFiltered.filter(i => 
        i.name.toLowerCase().includes(query)
      );
    }
    
    if (this.pointsFilter !== 'all') {
      iFiltered = iFiltered.filter(i => this.matchesPointsFilter(i.pointsRequired));
    }
    
    iFiltered = this.sortItems(iFiltered, 'item');
    this.filteredItems = iFiltered;
    
    setTimeout(() => {
      this.setupScrollReveal();
    }, 100);
  }

  private matchesPointsFilter(points: number): boolean {
    switch (this.pointsFilter) {
      case '0-200':
        return points >= 0 && points <= 200;
      case '200-400':
        return points > 200 && points <= 400;
      case '400-600':
        return points > 400 && points <= 600;
      case '600+':
        return points > 600;
      default:
        return true;
    }
  }

  private sortItems(items: any[], type: 'voucher' | 'item'): any[] {
    const sorted = [...items];
    
    if (this.pointsSort === 'low') {
      sorted.sort((a, b) => a.pointsRequired - b.pointsRequired);
    } else if (this.pointsSort === 'high') {
      sorted.sort((a, b) => b.pointsRequired - a.pointsRequired);
    }
    
    if (this.nameSort === 'asc') {
      sorted.sort((a, b) => {
        const nameA = type === 'voucher' ? a.type : a.name;
        const nameB = type === 'voucher' ? b.type : b.name;
        return nameA.localeCompare(nameB, 'vi');
      });
    } else if (this.nameSort === 'desc') {
      sorted.sort((a, b) => {
        const nameA = type === 'voucher' ? a.type : a.name;
        const nameB = type === 'voucher' ? b.type : b.name;
        return nameB.localeCompare(nameA, 'vi');
      });
    }
    
    return sorted;
  }

  changeCategory(category: string): void {
    this.selectedCategory = category;
  }

  changePointsSort(sort: string): void {
    this.pointsSort = sort;
    this.applyFilters();
  }

  changeNameSort(sort: string): void {
    this.nameSort = sort;
    this.applyFilters();
  }

  changePointsFilter(filter: string): void {
    this.pointsFilter = filter;
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.pointsSort = 'none';
    this.nameSort = 'none';
    this.pointsFilter = 'all';
    this.applyFilters();
  }
}

