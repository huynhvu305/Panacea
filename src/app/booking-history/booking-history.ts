import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserToolbarComponent } from '../user-toolbar/user-toolbar';
import { Booking } from '../interfaces/booking';
import { AuthService } from '../services/auth';
import { PdfService } from '../services/pdf.service';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';

export type BookingStatusTab = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

interface RoomData {
  room_id: number;
  room_name: string;
  range: string;
  price: number;
}

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [CommonModule, FormsModule, UserToolbarComponent],
  templateUrl: './booking-history.html',
  styleUrls: ['./booking-history.css'],
})

export class BookingHistoryComponent implements OnInit {
  bookings: Booking[] = [];
  selectedBooking: Booking | null = null;
  showModal = false;
  roomsMap: Map<number, RoomData> = new Map();
  currentUserId: string | null = null;

  constructor(
    private authService: AuthService,
    private pdfService: PdfService,
    private seoService: SEOService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Kiểm tra và chặn admin truy cập
    if (this.authService.isLoggedIn() && this.authService.isAdmin()) {
      Swal.fire({
        icon: 'warning',
        title: 'Không được phép truy cập',
        text: 'Tài khoản admin chỉ được truy cập vào các trang quản lý. Vui lòng sử dụng tài khoản khách hàng để xem lịch sử đặt phòng.',
        confirmButtonText: 'Về trang quản trị',
        allowOutsideClick: false
      }).then(() => {
        this.router.navigate(['/admin-dashboard']);
      });
      return;
    }

    // SEO
    this.seoService.updateSEO({
      title: 'Lịch Sử Đặt Phòng - Panacea',
      description: 'Xem lịch sử đặt phòng của bạn tại Panacea - Quản lý các đơn đặt phòng, xem chi tiết và in hóa đơn.',
      keywords: 'Lịch sử đặt phòng Panacea, quản lý đặt phòng, đơn đặt phòng, hóa đơn Panacea',
      robots: 'noindex, nofollow'
    });
    
    this.getCurrentUserId();
    
    fetch('assets/data/rooms.json')
      .then(res => res.json())
      .then((rooms: RoomData[]) => {
        rooms.forEach(room => {
          this.roomsMap.set(room.room_id, room);
        });

        return fetch('assets/data/bookings.json');
      })
      .then(res => res.json())
      .then((data: Booking[]) => {
        const updatesStr = localStorage.getItem('BOOKINGS_UPDATES');
        if (updatesStr) {
          try {
            const updates = JSON.parse(updatesStr);
            updates.forEach((updatedBooking: any) => {
              const index = data.findIndex(b => b.id === updatedBooking.id);
              if (index !== -1) {
                // Cập nhật booking đã tồn tại
                data[index] = { ...data[index], ...updatedBooking };
                console.log('Cập nhật booking đã tồn tại:', updatedBooking.id);
              } else {
                // Thêm booking mới vào danh sách
                data.push(updatedBooking);
                console.log('Thêm booking mới vào danh sách:', updatedBooking.id, 'userId:', updatedBooking.userId);
              }
            });
          } catch (e) {
            console.error('Error parsing bookings updates:', e);
          }
        }
        
        let filteredBookings = data;
        console.log('Tổng số booking trước khi filter:', data.length);
        if (this.currentUserId) {
          filteredBookings = data.filter((booking: any) => {
            // So sánh userId với nhiều format khác nhau (string, number)
            const bookingUserId = booking.userId ? String(booking.userId) : null;
            const currentUserIdStr = String(this.currentUserId);
            const matches = bookingUserId === currentUserIdStr;
            if (!matches) {
              console.log('Booking bị loại bỏ:', booking.id, 'booking.userId:', bookingUserId, 'currentUserId:', currentUserIdStr);
            }
            return matches;
          });
          console.log('Số booking sau khi filter theo userId:', filteredBookings.length);
        } else {
          // Nếu chưa đăng nhập, chỉ hiển thị booking không có userId hoặc có email/phone khớp với thông tin trong localStorage
          // (Tạm thời hiển thị tất cả booking không có userId khi chưa đăng nhập)
          filteredBookings = data.filter((booking: any) => {
            const hasNoUserId = !booking.userId || booking.userId === null || booking.userId === undefined;
            if (!hasNoUserId) {
              console.log('Booking bị loại bỏ (có userId nhưng chưa đăng nhập):', booking.id, 'userId:', booking.userId);
            }
            return hasNoUserId;
          });
          console.log('Số booking sau khi filter (chưa đăng nhập):', filteredBookings.length);
        }
        
        this.bookings = filteredBookings.map(booking => {
          const roomId = typeof booking.roomId === 'string' 
            ? parseInt(booking.roomId.replace('R', '')) 
            : booking.roomId;
          
          const roomData = this.roomsMap.get(roomId);
          
          if (roomData) {
            if (!booking.room) {
              (booking as any).room = {};
            }
            (booking as any).room.room_name = roomData.room_name;
            (booking as any).room.room_id = roomData.room_id;
            
            if (!booking.range || booking.range === '') {
              booking.range = roomData.range;
            }
          }
          
          return booking;
        });
      })
      .catch(err => console.error('Lỗi khi tải dữ liệu:', err));
  }

  /** Lấy user_id của user hiện tại đang đăng nhập */
  private getCurrentUserId(): void {
    try {
      // Ưu tiên lấy từ UID trong localStorage
      const uid = localStorage.getItem('UID');
      if (uid) {
        this.currentUserId = uid;
        return;
      }
      
      const currentUserStr = localStorage.getItem('CURRENT_USER');
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          if (currentUser && currentUser.user_id) {
            this.currentUserId = currentUser.user_id;
            return;
          }
        } catch (e) {
          console.error('Error parsing CURRENT_USER from localStorage:', e);
        }
      }
      
      const usersStr = localStorage.getItem('USERS');
      if (usersStr) {
        try {
          const users = JSON.parse(usersStr);
          // Lấy user đầu tiên nếu có (tạm thời, nên có UID)
          if (users.length > 0 && users[0].user_id) {
            this.currentUserId = users[0].user_id;
          }
        } catch (e) {
          console.error('Error parsing USERS from localStorage:', e);
        }
      }
    } catch (e) {
      console.error('Error getting current user ID:', e);
    }
  }

  // Trả về class CSS tương ứng trạng thái
  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'no-show':
        return 'status-no-show';
      default:
        return '';
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('vi-VN') + ' ₫';
  }

  openModal(booking: Booking): void {
    this.selectedBooking = booking;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedBooking = null;
  }

  // ====== ADD BELOW (outside class helpers OK, but keep inside component) ======

  activeTab: BookingStatusTab = 'all';
  
  // Phân trang
  currentPage: number = 1;
  itemsPerPage: number = 10;

  setTab(tab: BookingStatusTab) {
    this.activeTab = tab;
    this.currentPage = 1; // Reset về trang 1 khi đổi tab
  }

  get filteredBookings(): Booking[] {
    if (this.activeTab === 'all') return this.bookings;
    return this.bookings.filter(b => (b.status as any) === this.activeTab);
  }

  // Phân trang
  get paginatedBookings(): Booking[] {
    const filtered = this.filteredBookings;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredBookings.length / this.itemsPerPage);
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

  getRoomName(b: Booking): string {
    // Ưu tiên room.room_name từ rooms.json, sau đó mới đến room.name
    const roomName = (b as any)?.room?.room_name || (b as any)?.room?.name;
    
    if (roomName) {
      return roomName;
    }
    
    // Nếu không có trong booking, thử tìm từ roomsMap
    const roomId = typeof b.roomId === 'string' 
      ? parseInt(b.roomId.replace('R', '')) 
      : b.roomId;
    
    const roomData = this.roomsMap.get(roomId);
    return roomData?.room_name || '—';
  }

  /** Tính tổng giá của một service (có nhân quantity) */
  getServiceTotalPrice(service: any): number {
    const quantity = service.quantity || 1;
    return service.price * quantity;
  }

  /** Tính tổng giá tất cả services */
  getTotalServicesPrice(booking: Booking): number {
    if (!booking.services || booking.services.length === 0) {
      return 0;
    }
    return booking.services.reduce((total: number, service: any) => {
      const quantity = service.quantity || 1;
      return total + (service.price * quantity);
    }, 0);
  }

  /** Tính subtotal (basePrice + tổng services) */
  getSubtotal(booking: Booking): number {
    const basePrice = (booking as any).basePrice || 0;
    const servicesTotal = this.getTotalServicesPrice(booking);
    return basePrice + servicesTotal;
  }

  /** Tạo PDF hóa đơn */
  generateInvoice(booking: Booking, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const roomName = this.getRoomName(booking);
    this.pdfService.generateInvoice(booking, roomName);
  }

  /** Kiểm tra xem booking có thể in hóa đơn không (chỉ đơn đã hoàn thành) */
  canPrintInvoice(booking: Booking): boolean {
    return booking.status === 'completed';
  }

  /** Kiểm tra xem booking có sử dụng Xu không */
  hasUsedPoints(booking: Booking | null): boolean {
    if (!booking) return false;
    const b = booking as any;
    return b.usePoints === true && b.pointsDiscountValue > 0;
  }

  /** Lấy giá trị giảm từ Xu */
  getPointsDiscountValue(booking: Booking | null): number {
    if (!booking) return 0;
    const b = booking as any;
    return b.pointsDiscountValue || 0;
  }
}
