import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { UserToolbarComponent } from "../user-toolbar/user-toolbar";
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';

interface MembershipInfo {
  level: string;
  nextThreshold: number;
  coinsNeeded: number;
  nextLevel?: string;
}

type CoinTab = 'all' | 'processing' | 'increase' | 'decrease';

@Component({
  selector: 'app-cus-coin',
  standalone: true,
  imports: [UserToolbarComponent, CommonModule],
  templateUrl: './customer-coin.html',
  styleUrls: ['./customer-coin.css']
})
export class CustomerCoinComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  membershipInfo!: MembershipInfo;
  currentAccount: any;
  currentDate: string = new Date().toLocaleDateString('vi-VN');

  showAboutModal = false;
  showHistoryModal = false;
  selectedHistory: any = null;
  selectedHistoryDetail: any = null; // Chi tiết bổ sung (booking, exchange, review)
  roomsMap: Map<number, any> = new Map();

  // Tabs
  activeTab: CoinTab = 'all';

  // Lịch sử giao dịch Xu (load từ bookings, exchanges, redeems)
  coinHistory: any[] = [];
  
  // Phân trang
  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private authService: AuthService,
    private router: Router,
    private seoService: SEOService
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

    // SEO
    this.seoService.updateSEO({
      title: 'Xu Của Tôi - Panacea',
      description: 'Quản lý Xu Panacea của bạn - Xem số dư, lịch sử giao dịch và đổi Xu lấy voucher, ưu đãi đặc biệt.',
      keywords: 'Xu Panacea, quản lý Xu, lịch sử Xu, đổi Xu Panacea',
      robots: 'noindex, nofollow'
    });
    
    // Subscribe để cập nhật khi có thay đổi
    this.authService.getCurrentAccount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(account => {
      if (account) {
          this.loadUserData(account);
        } else {
          this.currentAccount = null;
          this.membershipInfo = this.calculateMembership(0);
      }
    });
    
    // Load rooms map
    fetch('assets/data/rooms.json')
      .then(res => res.json())
      .then((rooms: any[]) => {
        rooms.forEach(room => {
          this.roomsMap.set(room.room_id, room);
        });
      })
      .catch(err => console.error('Lỗi khi tải rooms:', err));
    
    // Load lịch sử giao dịch Xu
    this.loadCoinHistory();
    
    // Listen cho event khi Xu được cập nhật (từ payment, exchange-landing)
    window.addEventListener('userPointsUpdated', () => {
      // Reload lịch sử và số dư Xu ngay lập tức
      this.loadUserData(this.currentAccount || {});
      this.loadCoinHistory();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Load dữ liệu từ users.json */
  private loadUserData(account: any): void {
    try {
      const usersStr = localStorage.getItem('USERS');
      const uid = localStorage.getItem('UID');
      let userCoin = 0;
      
      // Ưu tiên lấy từ USERS list
      if (usersStr && uid) {
        try {
          const users = JSON.parse(usersStr);
          const user = users.find((u: any) => u.user_id === uid);
          if (user) {
            userCoin = user.coin || 0;
          }
        } catch (e) {
          console.error('Error parsing USERS from localStorage:', e);
        }
      }
      
      // Nếu không tìm thấy, thử lấy từ CURRENT_USER
      if (userCoin === 0) {
        const currentUserStr = localStorage.getItem('CURRENT_USER');
        if (currentUserStr) {
          try {
            const currentUser = JSON.parse(currentUserStr);
            userCoin = currentUser.coin || 0;
          } catch (e) {
            console.error('Error parsing CURRENT_USER from localStorage:', e);
          }
        }
      }
      
      // Cập nhật currentAccount với coin từ users.json
          this.currentAccount = {
            ...account,
            coin: userCoin
          };
          const star = account.star ?? 0;
          this.membershipInfo = this.calculateMembership(star);
    } catch (e) {
      console.error('Error loading user data:', e);
      // Fallback: sử dụng account từ authService
        const star = account?.star ?? 0;
        this.currentAccount = account;
        this.membershipInfo = this.calculateMembership(star);
    }
  }

  calculateMembership(star: number): MembershipInfo {
    // Tương tự như customer-star.ts
    if (star >= 100) {
      return { 
        level: 'DIAMOND PRIORITY', 
        nextThreshold: 0, 
        coinsNeeded: 0 
      };
    } else if (star >= 50) {
      return { 
        level: 'PLATINUM PRIORITY', 
        nextThreshold: 100, 
        coinsNeeded: 100 - star, 
        nextLevel: 'DIAMOND PRIORITY' 
      };
    } else if (star >= 20) {
      return { 
        level: 'GOLD PRIORITY', 
        nextThreshold: 50, 
        coinsNeeded: 50 - star, 
        nextLevel: 'PLATINUM PRIORITY' 
      };
    } else if (star >= 5) {
      return { 
        level: 'SILVER PRIORITY', 
        nextThreshold: 20, 
        coinsNeeded: 20 - star, 
        nextLevel: 'GOLD PRIORITY' 
      };
    } else {
      return { 
        level: 'BRONZE PRIORITY', 
        nextThreshold: 5, 
        coinsNeeded: 5 - star, 
        nextLevel: 'SILVER PRIORITY' 
      };
    }
  }

  calcProgressPercent(star: number): number {
    const next = this.membershipInfo.nextThreshold;
    if (next === 0) return 100;
    
    const prev =
      this.membershipInfo.level === 'SILVER PRIORITY' ? 5 :
        this.membershipInfo.level === 'GOLD PRIORITY' ? 20 :
          this.membershipInfo.level === 'PLATINUM PRIORITY' ? 50 : 0;
    
    return Math.min(((star - prev) / (next - prev)) * 100, 100);
  }

  // ====== Actions (giữ nguyên modal) ======
  openAboutPoint(): void { this.showAboutModal = true; document.body.style.overflow = 'hidden'; }
  closeAboutPoint(): void { this.showAboutModal = false; document.body.style.overflow = ''; }
  openLearnHow(): void { window.open('/support/coin', '_blank'); }
  @HostListener('document:keydown.escape') onEsc() { if (this.showAboutModal) this.closeAboutPoint(); }

  // Modal lịch sử
  openHistoryDetail(item: any): void {
    this.selectedHistory = item;
    this.selectedHistoryDetail = null;
    
    // Load chi tiết bổ sung dựa trên type
    if (item.type === 'booking' && item.bookingId) {
      this.loadBookingDetail(item.bookingId);
    } else if (item.type === 'exchange') {
      this.loadExchangeDetail(item.id);
    } else if (item.type === 'redeem') {
      // Redeem liên kết với booking, cần tìm booking từ localStorage
      this.loadRedeemBookingDetail();
    } else if (item.type === 'review' && item.reviewId) {
      this.loadReviewDetail(item.reviewId);
    } else if (item.type === 'deleted_review') {
      // Không cần load thêm thông tin cho deleted review
    }
    
    this.showHistoryModal = true;
    document.body.style.overflow = 'hidden';
  }
  
  closeHistoryDetail(): void {
    this.showHistoryModal = false;
    this.selectedHistory = null;
    this.selectedHistoryDetail = null;
    document.body.style.overflow = '';
  }
  
  /**
   * Load chi tiết booking
   */
  private loadBookingDetail(bookingId: string): void {
    fetch('assets/data/bookings.json')
      .then(res => res.json())
      .then((bookings: any[]) => {
        const updatesStr = localStorage.getItem('BOOKINGS_UPDATES');
        let updates: any[] = [];
        if (updatesStr) {
          try {
            updates = JSON.parse(updatesStr);
          } catch (e) {
            console.warn('Không thể parse BOOKINGS_UPDATES:', e);
          }
        }
        
        const allBookings = [...bookings, ...updates];
        const booking = allBookings.find((b: any) => b.id === bookingId);
        
        if (booking) {
          // Thêm thông tin room
          const roomId = typeof booking.roomId === 'string' 
            ? parseInt(booking.roomId.replace('R', '')) 
            : booking.roomId;
          const roomData = this.roomsMap.get(roomId);
          
          if (roomData && !booking.room) {
            booking.room = {};
          }
          if (roomData) {
            booking.room.room_name = roomData.room_name;
            booking.room.room_id = roomData.room_id;
            if (!booking.range || booking.range === '') {
              booking.range = roomData.range;
            }
          }
          
          this.selectedHistoryDetail = booking;
        }
      })
      .catch(err => console.error('Lỗi khi tải booking detail:', err));
  }
  
  /**
   * Load chi tiết exchange (voucher hoặc item)
   */
  private loadExchangeDetail(exchangeId: string): void {
    const exchangesStr = localStorage.getItem('COIN_EXCHANGES');
    if (exchangesStr) {
      try {
        const exchanges = JSON.parse(exchangesStr);
        const exchange = exchanges.find((e: any) => e.id === exchangeId || `exchange_${e.id}` === exchangeId);
        if (exchange) {
          this.selectedHistoryDetail = exchange;
        }
      } catch (e) {
        console.warn('Không thể parse COIN_EXCHANGES:', e);
      }
    }
  }
  
  /**
   * Load booking detail cho redeem (tìm booking gần nhất có usePoints = true)
   */
  private loadRedeemBookingDetail(): void {
    fetch('assets/data/bookings.json')
      .then(res => res.json())
      .then((bookings: any[]) => {
        const updatesStr = localStorage.getItem('BOOKINGS_UPDATES');
        let updates: any[] = [];
        if (updatesStr) {
          try {
            updates = JSON.parse(updatesStr);
          } catch (e) {
            console.warn('Không thể parse BOOKINGS_UPDATES:', e);
          }
        }
        
        const allBookings = [...bookings, ...updates];
        const uid = localStorage.getItem('UID');
        const currentUserId = uid || (this.currentAccount?.id ? `US${String(this.currentAccount.id).padStart(3, '0')}` : null);
        
        // Tìm booking gần nhất có usePoints = true của user này
        const redeemBookings = allBookings
          .filter((b: any) => {
            const bookingUserId = b.userId ? String(b.userId) : null;
            return bookingUserId === currentUserId && (b as any).usePoints === true;
          })
          .sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // Mới nhất trước
          });
        
        if (redeemBookings.length > 0) {
          const booking = redeemBookings[0];
          // Thêm thông tin room
          const roomId = typeof booking.roomId === 'string' 
            ? parseInt(booking.roomId.replace('R', '')) 
            : booking.roomId;
          const roomData = this.roomsMap.get(roomId);
          
          if (roomData && !booking.room) {
            booking.room = {};
          }
          if (roomData) {
            booking.room.room_name = roomData.room_name;
            booking.room.room_id = roomData.room_id;
            if (!booking.range || booking.range === '') {
              booking.range = roomData.range;
            }
          }
          
          this.selectedHistoryDetail = booking;
        }
      })
      .catch(err => console.error('Lỗi khi tải redeem booking detail:', err));
  }
  
  /**
   * Load chi tiết review
   */
  private loadReviewDetail(reviewId: string): void {
    fetch('assets/data/reviews.json')
      .then(res => res.json())
      .then((reviews: any[]) => {
        const localReviewsStr = localStorage.getItem('REVIEWS');
        let localReviews: any[] = [];
        if (localReviewsStr) {
          try {
            localReviews = JSON.parse(localReviewsStr);
          } catch (e) {
            console.warn('Không thể parse REVIEWS:', e);
          }
        }
        
        const allReviews = [...reviews, ...localReviews];
        const review = allReviews.find((r: any) => r.id === reviewId);
        
        if (review) {
          this.selectedHistoryDetail = review;
        }
      })
      .catch(err => console.error('Lỗi khi tải review detail:', err));
  }
  
  /**
   * Helper methods để hiển thị trong modal
   */
  getRoomName(booking: any): string {
    if (!booking) return '—';
    const roomName = booking?.room?.room_name || booking?.room?.name;
    if (roomName) return roomName;
    
    const roomId = typeof booking.roomId === 'string' 
      ? parseInt(booking.roomId.replace('R', '')) 
      : booking.roomId;
    const roomData = this.roomsMap.get(roomId);
    return roomData?.room_name || '—';
  }
  
  formatCurrency(value: number): string {
    return value.toLocaleString('vi-VN') + ' ₫';
  }
  
  formatReviewDate(review: any): string {
    if (!review) return '—';
    if (review.createdAt) {
      return new Date(review.createdAt).toLocaleDateString('vi-VN');
    }
    if (review.date) {
      return review.date;
    }
    return '—';
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'no-show': return 'Không đến';
      default: return status;
    }
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      case 'no-show': return 'status-no-show';
      default: return '';
    }
  }

  // ====== Tabs + Filter ======
  mapStatus(item: any): 'processing' | 'done' {
    const s = (item?.status || '').toLowerCase();
    if (s.includes('xử lý')) return 'processing';
    if (s.includes('hoàn tất') || s.includes('hoan tat')) return 'done';
    return 'processing';
  }
  
  displayStatus(item: any): string {
    const code = this.mapStatus(item);
    return code === 'processing' ? 'Đang xử lý'
      : code === 'done' ? 'Hoàn tất'
        : 'Đang xử lý';
  }
  
  setTab(tab: CoinTab): void {
    this.activeTab = tab;
    this.currentPage = 1; // Reset về trang 1 khi đổi tab
  }
  
  get filteredCoinHistory() {
    let filtered = this.coinHistory;
    
    if (this.activeTab === 'all') {
      // Không filter
    } else if (this.activeTab === 'processing') {
      filtered = filtered.filter(i => this.mapStatus(i) === 'processing');
    } else if (this.activeTab === 'increase') {
      filtered = filtered.filter(i => i.amount > 0);
    } else if (this.activeTab === 'decrease') {
      filtered = filtered.filter(i => i.amount < 0);
    }
    
    return filtered;
  }

  // Phân trang
  get paginatedCoinHistory() {
    const filtered = this.filteredCoinHistory;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCoinHistory.length / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  getCoinHistoryStatusClass(item: any): string {
    const code = this.mapStatus(item); // 'processing' | 'done'
    switch (code) {
      case 'processing': return 'status-processing';
      case 'done': return 'status-done';
      default: return 'status-processing';
    }
  }

  // (Tuỳ chọn) format số xu nếu bạn muốn chuẩn hoá
  formatCoin(amount: number): string {
    const sign = amount > 0 ? '+' : '';
    return `${sign}${amount}`;
  }

  /**
   * Load lịch sử giao dịch Xu từ bookings, exchanges, và redeems
   */
  private loadCoinHistory(): void {
    const history: any[] = [];
    const uid = localStorage.getItem('UID');
    const currentUserId = uid || (this.currentAccount?.id ? `US${String(this.currentAccount.id).padStart(3, '0')}` : null);
    
    // 1. Load từ bookings (chỉ cộng Xu khi status = "confirmed", pending = "Đang xử lý")
    fetch('assets/data/bookings.json')
      .then(res => res.json())
      .then((bookings: any[]) => {
        const updatesStr = localStorage.getItem('BOOKINGS_UPDATES');
        let updates: any[] = [];
        if (updatesStr) {
          try {
            updates = JSON.parse(updatesStr);
          } catch (e) {
            console.warn('Không thể parse BOOKINGS_UPDATES:', e);
          }
        }
        
        const allBookings = [...bookings, ...updates];
        
        // Map để tránh trùng lặp booking (chỉ giữ 1 entry, cập nhật status)
        const bookingMap = new Map<string, any>();
        
        allBookings.forEach((booking: any) => {
          const bookingUserId = booking.userId ? String(booking.userId) : null;
          if (bookingUserId && currentUserId && bookingUserId === currentUserId) {
            const rewardPoints = booking.rewardPointsEarned || 0;
            if (rewardPoints > 0) {
              // Parse ngày từ createdAt (ngày đặt đơn)
              let dateStr = '';
              if (booking.createdAt) {
                const date = new Date(booking.createdAt);
                dateStr = date.toLocaleDateString('vi-VN');
              } else {
                dateStr = new Date().toLocaleDateString('vi-VN');
              }
              
              const roomName = booking.room?.room_name || booking.room?.name || 'Phòng';
              
              // Xác định status: chỉ pending (chờ xác nhận) = "Đang xử lý", tất cả trường hợp khác = "Hoàn tất"
              const status = booking.status === 'pending' ? 'Đang xử lý' : 'Hoàn tất';
              
              // Chỉ cộng Xu khi status = "completed"
              const amount = booking.status === 'completed' ? +rewardPoints : 0;
              
              // Nếu đã có entry cho booking này, cập nhật status và amount
              const existingEntry = bookingMap.get(booking.id);
              if (existingEntry) {
                existingEntry.status = status;
                existingEntry.amount = amount;
              } else {
                bookingMap.set(booking.id, {
                  id: `booking_${booking.id}`,
                  date: dateStr,
                  description: `Nhận xu từ đặt phòng ${roomName}`,
                  amount: amount,
                  status: status,
                  icon: 'bi bi-cash-coin',
                  type: 'booking',
                  bookingId: booking.id
                });
              }
            }
          }
        });
        
        // Thêm tất cả bookings vào history
        bookingMap.forEach((entry) => {
          history.push(entry);
        });
        
        // Load exchanges, redeems, và reviews
        this.loadExchangesAndRedeems(history, currentUserId);
        this.loadReviews(history, currentUserId);
      })
      .catch(err => {
        console.error('Lỗi khi tải bookings:', err);
        // Vẫn tiếp tục load exchanges và redeems
        this.loadExchangesAndRedeems(history, currentUserId);
        this.loadReviews(history, currentUserId);
      });
  }

  /**
   * Load reviews (đánh giá +50 Xu, xóa -50 Xu)
   */
  private loadReviews(history: any[], currentUserId: string | null): void {
    fetch('assets/data/reviews.json')
      .then(res => res.json())
      .then((reviews: any[]) => {
        const localReviewsStr = localStorage.getItem('REVIEWS');
        let localReviews: any[] = [];
        if (localReviewsStr) {
          try {
            localReviews = JSON.parse(localReviewsStr);
          } catch (e) {
            console.warn('Không thể parse REVIEWS:', e);
          }
        }
        
        const allReviews = [...reviews, ...localReviews];
        
        // Map để tránh trùng lặp (mỗi review chỉ có 1 entry)
        const reviewMap = new Map<string, any>();
        
        allReviews.forEach((review: any) => {
          const reviewUserId = review.userId ? String(review.userId) : null;
          if (reviewUserId && currentUserId && reviewUserId === currentUserId) {
            // Parse ngày từ createdAt hoặc date
            let dateStr = '';
            if (review.createdAt) {
              const date = new Date(review.createdAt);
              dateStr = date.toLocaleDateString('vi-VN');
            } else if (review.date) {
              const date = new Date(review.date);
              dateStr = date.toLocaleDateString('vi-VN');
            } else {
              dateStr = new Date().toLocaleDateString('vi-VN');
            }
            
            // Nếu đã có entry cho review này, bỏ qua (không tạo mới)
            if (!reviewMap.has(review.id)) {
              reviewMap.set(review.id, {
                id: `review_${review.id}`,
                date: dateStr,
                description: 'Nhận xu từ đánh giá',
                amount: +50,
                status: 'Hoàn tất',
                icon: 'bi bi-star-fill',
                type: 'review',
                reviewId: review.id,
                bookingId: review.bookingId
              });
            }
          }
        });
        
        // Thêm tất cả reviews vào history
        reviewMap.forEach((entry) => {
          history.push(entry);
        });
        
        // Load deleted reviews (xóa đánh giá -50 Xu)
        const deletedReviewsStr = localStorage.getItem('DELETED_REVIEWS');
        let deletedReviews: any[] = [];
        if (deletedReviewsStr) {
          try {
            deletedReviews = JSON.parse(deletedReviewsStr);
            deletedReviews.forEach((deleted: any) => {
              if (deleted.userId === currentUserId || !deleted.userId) {
                let dateStr = '';
                if (deleted.deletedAt) {
                  const date = new Date(deleted.deletedAt);
                  dateStr = date.toLocaleDateString('vi-VN');
                } else {
                  dateStr = new Date().toLocaleDateString('vi-VN');
                }
                
                history.push({
                  id: `deleted_review_${deleted.reviewId || Date.now()}`,
                  date: dateStr,
                  description: 'Trừ xu do xóa đánh giá',
                  amount: -50,
                  status: 'Hoàn tất',
                  icon: 'bi bi-star',
                  type: 'deleted_review',
                  reviewId: deleted.reviewId
                });
              }
            });
          } catch (e) {
            console.warn('Không thể parse DELETED_REVIEWS:', e);
          }
        }
        
        // Sắp xếp theo ngày (mới nhất trước) và cập nhật coinHistory
        history.sort((a, b) => {
          const dateA = this.parseDate(a.date);
          const dateB = this.parseDate(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        
        this.coinHistory = history;
      })
      .catch(err => {
        console.error('Lỗi khi tải reviews:', err);
        // Vẫn tiếp tục với dữ liệu đã có
        history.sort((a, b) => {
          const dateA = this.parseDate(a.date);
          const dateB = this.parseDate(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        this.coinHistory = history;
      });
  }

  /**
   * Load exchanges và redeems (helper method)
   */
  private loadExchangesAndRedeems(history: any[], currentUserId: string | null): void {
    // 2. Load từ exchanges (đổi voucher/item)
    const exchangesStr = localStorage.getItem('COIN_EXCHANGES');
    let exchanges: any[] = [];
    if (exchangesStr) {
      try {
        exchanges = JSON.parse(exchangesStr);
        exchanges.forEach((exchange: any) => {
          if (exchange.userId === currentUserId || !exchange.userId) {
            history.push({
              id: `exchange_${exchange.id || Date.now()}`,
              date: exchange.date || new Date().toLocaleDateString('vi-VN'),
              description: exchange.description || (exchange.type === 'voucher' ? `Đổi voucher ${exchange.voucherType || ''}` : `Đổi ${exchange.itemName || 'vật phẩm'}`),
              amount: -exchange.amount,
              status: 'Hoàn tất',
              icon: exchange.type === 'voucher' ? 'bi bi-ticket-perforated' : 'bi bi-bag-heart',
              type: 'exchange'
            });
          }
        });
      } catch (e) {
        console.warn('Không thể parse COIN_EXCHANGES:', e);
      }
    }
    
    // 3. Load từ redeems (redeem Xu ở payment)
    const redeemsStr = localStorage.getItem('COIN_REDEEMS');
    let redeems: any[] = [];
    if (redeemsStr) {
      try {
        redeems = JSON.parse(redeemsStr);
        redeems.forEach((redeem: any) => {
          if (redeem.userId === currentUserId || !redeem.userId) {
            history.push({
              id: `redeem_${redeem.id || Date.now()}`,
              date: redeem.date || new Date().toLocaleDateString('vi-VN'),
              description: 'Đổi 50 Xu để giảm 20.000đ',
              amount: -50,
              status: 'Hoàn tất',
              icon: 'bi bi-coin',
              type: 'redeem'
            });
          }
        });
      } catch (e) {
        console.warn('Không thể parse COIN_REDEEMS:', e);
      }
    }
  }

  /**
   * Parse date string (dd/mm/yyyy) thành Date object
   */
  private parseDate(dateStr: string): Date {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date();
  }

  /**
   * Lấy loại giao dịch để hiển thị
   */
  getTransactionType(item: any): string {
    if (item.type === 'booking') {
      return 'Nhận xu từ đặt phòng';
    } else if (item.type === 'exchange') {
      if (item.description && item.description.includes('voucher')) {
        return 'Đổi voucher';
      }
      return 'Đổi quà/ưu đãi';
    } else if (item.type === 'redeem') {
      return 'Đổi xu giảm giá';
    }
    return item.description && item.description.includes('voucher') ? 'Đổi voucher' : 'Đổi quà/ưu đãi';
  }
}
