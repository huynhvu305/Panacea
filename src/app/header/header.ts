import { Component, HostListener, OnInit, ChangeDetectorRef, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  isOpen = false;           // mobile menu drawer
  scrolled = false;         // sticky shadow
  currentAccount: any = null;
  isAdmin: boolean = false;
  isDropdownOpen = false;  // user dropdown menu
  isSupportDropdownOpen = false;  // support dropdown menu (desktop)
  isMobileSupportDropdownOpen = false;  // support dropdown menu (mobile)
  isPolicyDropdownOpen = false;  // policy dropdown menu (desktop)
  isAboutDropdownOpen = false;  // about dropdown menu (desktop)
  isMobileAboutDropdownOpen = false;  // about dropdown menu (mobile)
  isMoreDropdownOpen = false;  // more dropdown menu (tablet)

  membership = 'BRONZE PRIORITY';
  membershipClass = 'bronze';

  private lastFocusedElement: HTMLElement | null = null;
  private routerSubscription?: Subscription;
  private focusableElements: HTMLElement[] = [];
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;

  @ViewChild('drawer', { static: false }) drawerRef?: ElementRef<HTMLElement>;

  constructor(
    public authService: AuthService, 
    private router: Router,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadAccount();
    
    this.isAdmin = this.authService.isAdmin();
    
    // Sử dụng bubbling phase (mặc định) để chạy SAU các handler khác
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Bỏ qua nếu click vào user-info-wrapper, user-drop, menu-item, dropdown-arrow, hoặc user-header
      // (các phần tử này đã có handler riêng và đã gọi stopPropagation)
      const clickedInsideUserDropdown = 
        target.closest('.user-info-wrapper') || 
        target.closest('.user-drop') || 
        target.closest('.menu-item') || 
        target.closest('.dropdown-arrow') || 
        target.closest('.user-header');
      
      if (clickedInsideUserDropdown) {
        return;
      }
      
      // Chỉ đóng user dropdown nếu click ra ngoài hoàn toàn
      // Delay một chút để đảm bảo các click handler khác đã chạy xong
      setTimeout(() => {
        if (this.isDropdownOpen) {
          const mouseEvent = event as MouseEvent;
          const currentTarget = document.elementFromPoint(mouseEvent.clientX, mouseEvent.clientY) as HTMLElement;
          const stillInside = 
            currentTarget?.closest('.user-info-wrapper') || 
            currentTarget?.closest('.user-drop') || 
            currentTarget?.closest('.menu-item') || 
            currentTarget?.closest('.dropdown-arrow') || 
            currentTarget?.closest('.user-header');
          
          if (!stillInside) {
            this.isDropdownOpen = false;
            this.cdr.detectChanges();
          }
        }
      }, 10);
      
      if (window.innerWidth < 992 && !target.closest('.support-dropdown') && !target.closest('.drawer-dropdown')) {
        this.isSupportDropdownOpen = false;
        this.isMobileSupportDropdownOpen = false;
      }
      if (window.innerWidth < 992 && !target.closest('.policy-dropdown')) {
        this.isPolicyDropdownOpen = false;
      }
      if (window.innerWidth < 992 && !target.closest('.about-dropdown') && !target.closest('.drawer-dropdown-about')) {
        this.isAboutDropdownOpen = false;
        this.isMobileAboutDropdownOpen = false;
      }
      if (!target.closest('.more-dropdown')) {
        this.isMoreDropdownOpen = false;
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth < 992) {
        this.isSupportDropdownOpen = false;
        this.isPolicyDropdownOpen = false;
        this.isAboutDropdownOpen = false;
        this.isMoreDropdownOpen = false;
      }
      if (window.innerWidth >= 768 && this.isOpen) {
        this.closeMenu();
      }
    });
    
    this.authService.currentAccount$.subscribe({
      next: (acc) => {
        if (acc) {
          // Dữ liệu đã được sync vào localStorage trong AuthService.login()
          this.loadAccount();
          this.isAdmin = this.authService.isAdmin();
        } else {
          this.currentAccount = null;
          this.isAdmin = false;
          this.membership = 'BRONZE PRIORITY';
          this.membershipClass = 'bronze';
          this.isDropdownOpen = false;
        }
      }
    });

    // Listen cho event khi Xu được cập nhật (từ payment hoặc exchange-landing)
    window.addEventListener('userPointsUpdated', () => {
      // Reload account để cập nhật số Xu mới nhất NGAY LẬP TỨC
      this.loadAccount();
    });

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isOpen) {
          this.closeMenu();
        }
      });
  }

  ngAfterViewInit(): void {
    this.updateFocusableElements();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadAccount(): void {
    // Đảm bảo lấy dữ liệu mới nhất từ USERS list (đã được sync từ users.json trong AuthService.login())
    const usersStr = localStorage.getItem('USERS');
    const uid = localStorage.getItem('UID');
    
    if (usersStr && uid) {
      try {
        const users = JSON.parse(usersStr);
        const user = users.find((u: any) => u.user_id === uid);
        if (user) {
          // Đảm bảo không dùng dữ liệu cũ, luôn lấy từ users.json
          // Ưu tiên lấy coin, nếu không có thì lấy point
          const coinValue = user.coin !== undefined ? user.coin : (user.point !== undefined ? user.point : 0);
          const account = {
            id: parseInt(user.user_id?.replace('US', '') || '0') || 0,
            ho_ten: user.full_name || 'Username',
            email: user.email || '',
            phone_number: user.phone_number || '',
            diem_tich_luy: user.star || 0,
            diem_kha_dung: coinValue,
            coin: coinValue, // Thêm field coin để đảm bảo hiển thị đúng
            star: user.star || 0
          };
          
          this.currentAccount = account;
          this.calculateMembership(account.diem_tich_luy);
          localStorage.setItem('CURRENT_USER', JSON.stringify(user));
          this.isAdmin = this.authService.isAdmin();
          this.cdr.detectChanges();
        } else {
          this.loadFromCurrentUser();
        }
      } catch (e) {
        console.error('Error loading account from USERS list:', e);
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
        // Đảm bảo lấy đúng dữ liệu từ CURRENT_USER (đã được sync từ users.json)
        // Ưu tiên lấy coin, nếu không có thì lấy point
        const coinValue = user.coin !== undefined ? user.coin : (user.point !== undefined ? user.point : 0);
        const account = {
          id: parseInt(user.user_id?.replace('US', '') || '0') || 0,
          ho_ten: user.full_name || 'Username',
          email: user.email || '',
          phone_number: user.phone_number || '',
          diem_tich_luy: user.star || 0,
          diem_kha_dung: coinValue,
          coin: coinValue, // Thêm field coin để đảm bảo hiển thị đúng
          star: user.star || 0
        };
        this.currentAccount = account;
        this.calculateMembership(account.diem_tich_luy);
        this.isAdmin = this.authService.isAdmin();
      } catch (e) {
        console.error('Error loading account from CURRENT_USER:', e);
        this.currentAccount = null;
        this.membership = 'BRONZE PRIORITY';
        this.membershipClass = 'bronze';
        this.isAdmin = false;
      }
    } else {
      this.currentAccount = null;
      this.membership = 'BRONZE PRIORITY';
      this.membershipClass = 'bronze';
      this.isAdmin = false;
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 8;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen) {
      this.closeMenu();
    }

    if (this.isOpen && event.key === 'Tab') {
      this.handleFocusTrap(event);
    }
  }
  private handleFocusTrap(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    this.updateFocusableElements();

    if (this.focusableElements.length === 0) return;

    const isTabPressed = event.key === 'Tab' && !event.shiftKey;
    const isShiftTabPressed = event.key === 'Tab' && event.shiftKey;

    if (isTabPressed) {
      if (document.activeElement === this.lastFocusableElement) {
        event.preventDefault();
        this.firstFocusableElement?.focus();
      }
    } else if (isShiftTabPressed) {
      if (document.activeElement === this.firstFocusableElement) {
        event.preventDefault();
        this.lastFocusableElement?.focus();
      }
    }
  }
  private updateFocusableElements(): void {
    const drawer = document.getElementById('site-drawer');
    if (!drawer) {
      this.focusableElements = [];
      this.firstFocusableElement = null;
      this.lastFocusableElement = null;
      return;
    }

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    this.focusableElements = Array.from(
      drawer.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });

    this.firstFocusableElement = this.focusableElements[0] || null;
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  toggle(): void {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu(): void {
    this.isOpen = true;
    this.lastFocusedElement = document.activeElement as HTMLElement;
    
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      this.updateFocusableElements();
      const closeButton = document.querySelector('.drawer-close') as HTMLElement;
      if (closeButton) {
        closeButton.focus();
      } else if (this.firstFocusableElement) {
        this.firstFocusableElement.focus();
      }
    }, 100);
    
    this.cdr.detectChanges();
  }

  closeMenu(): void {
    this.isOpen = false;
    this.isMobileSupportDropdownOpen = false;
    this.isMobileAboutDropdownOpen = false;
    
    document.body.style.overflow = '';
    
    if (this.lastFocusedElement) {
      setTimeout(() => {
        this.lastFocusedElement?.focus();
        this.lastFocusedElement = null;
      }, 100);
    }
    
    this.cdr.detectChanges();
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
    this.cdr.detectChanges();
  }

  openDropdown(): void {
    if (!this.isDropdownOpen) {
      this.isDropdownOpen = true;
      this.cdr.detectChanges();
    }
  }

  closeDropdown(): void {
    setTimeout(() => {
      this.isDropdownOpen = false;
      this.cdr.detectChanges();
    }, 100);
  }

  closeDropdownOnLeave(event: MouseEvent): void {
    setTimeout(() => {
      const relatedTarget = event.relatedTarget as HTMLElement;
      const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY);
      
      const isInsideDropdown = 
        (relatedTarget && (relatedTarget.closest('.user-info-wrapper') || relatedTarget.closest('.user-drop'))) ||
        (elementAtPoint && (elementAtPoint.closest('.user-info-wrapper') || elementAtPoint.closest('.user-drop')));
      
      if (!isInsideDropdown) {
        this.isDropdownOpen = false;
        this.cdr.detectChanges();
      }
    }, 150);
  }

  handleUserWrapperClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('.menu-item') || target.closest('.user-drop')) {
      return;
    }
    if (target.closest('.dropdown-arrow')) {
      return;
    }
    if (target.closest('.user-header')) {
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.toggleDropdown(event);
    }
  }

  gotoAccount() {
    this.router.navigate(['/customer-account/account-information']);
  }

  openSupportDropdown() {
    if (window.innerWidth >= 992) {
      this.isSupportDropdownOpen = true;
    }
  }

  closeSupportDropdown() {
    this.isSupportDropdownOpen = false;
  }

  toggleSupportDropdown(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.isSupportDropdownOpen = !this.isSupportDropdownOpen;
  }

  toggleMobileSupportDropdown() {
    this.isMobileSupportDropdownOpen = !this.isMobileSupportDropdownOpen;
  }

  openPolicyDropdown() {
    if (window.innerWidth >= 992) {
      this.isPolicyDropdownOpen = true;
    }
  }

  closePolicyDropdown() {
    this.isPolicyDropdownOpen = false;
  }

  togglePolicyDropdown(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.isPolicyDropdownOpen = !this.isPolicyDropdownOpen;
  }

  openAboutDropdown() {
    if (window.innerWidth >= 992) {
      this.isAboutDropdownOpen = true;
    }
  }

  closeAboutDropdown() {
    this.isAboutDropdownOpen = false;
  }

  toggleAboutDropdown(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.isAboutDropdownOpen = !this.isAboutDropdownOpen;
  }

  toggleMobileAboutDropdown() {
    this.isMobileAboutDropdownOpen = !this.isMobileAboutDropdownOpen;
  }

  openMoreDropdown() {
    if (window.innerWidth >= 768 && window.innerWidth < 992) {
      this.isMoreDropdownOpen = true;
    }
  }

  closeMoreDropdown() {
    this.isMoreDropdownOpen = false;
  }

  toggleMoreDropdown(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.isMoreDropdownOpen = !this.isMoreDropdownOpen;
  }

  calculateMembership(diem: number): void {
    // Theo hình ảnh: Diamond (100 sao), Platinum (50 sao), Gold (20 sao), Silver (5 sao), Bronze (0 sao)
    if (diem >= 100) { this.membership = 'DIAMOND PRIORITY'; this.membershipClass = 'diamond'; }
    else if (diem >= 50) { this.membership = 'PLATINUM PRIORITY'; this.membershipClass = 'platinum-20m'; }
    else if (diem >= 20) { this.membership = 'GOLD PRIORITY'; this.membershipClass = 'gold'; }
    else if (diem >= 5) { this.membership = 'SILVER PRIORITY'; this.membershipClass = 'silver'; }
    else { this.membership = 'BRONZE PRIORITY'; this.membershipClass = 'bronze'; }
  }

  logout() {
    Swal.fire({
      title: 'Bạn có chắc chắn muốn đăng xuất?',
      text: 'Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng những ưu đãi!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#132fba',
      reverseButtons: true
    }).then(res => {
      if (res.isConfirmed) {
        this.authService.logout();
        this.router.navigateByUrl('/');
        Swal.fire({ 
          title: 'Đăng xuất thành công!', 
          icon: 'success', 
          confirmButtonColor: '#132fba',
          timer: 1600 
        });
      }
    });
  }
}
