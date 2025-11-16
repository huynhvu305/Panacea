import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Booking } from '../interfaces/booking';
import { AuthService } from '../services/auth';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';

interface RoomData {
  room_id: number;
  room_name: string;
  range: string;
  price: number;
}

export type BookingStatusTab = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-bookings.html',
  styleUrls: ['./admin-bookings.css']
})
export class AdminBookings implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  roomsMap: Map<number, RoomData> = new Map();
  activeTab: BookingStatusTab = 'all';
  searchTerm: string = '';
  selectedBooking: Booking | null = null;
  showModal: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private seoService: SEOService
  ) { }

  ngOnInit(): void {
    // Kiểm tra quyền admin
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }
    this.seoService.updateSEO({
      title: 'Admin - Quản Lý Đặt Phòng - Panacea',
      description: 'Trang quản trị đặt phòng - Quản lý đơn đặt phòng và lịch hẹn Panacea',
      robots: 'noindex, nofollow'
    });
    this.loadRooms();
    this.loadBookings();
  }

  loadRooms(): void {
    fetch('assets/data/rooms.json')
      .then(res => res.json())
      .then((rooms: RoomData[]) => {
        rooms.forEach(room => {
          this.roomsMap.set(room.room_id, room);
        });
      })
      .catch(err => console.error('Error loading rooms:', err));
  }

  loadBookings(): void {
    fetch('assets/data/bookings.json')
      .then(res => res.json())
      .then((data: Booking[]) => {
        this.bookings = data.map(booking => {
          const roomId = typeof booking.roomId === 'string'
            ? parseInt(booking.roomId.replace('R', ''))
            : booking.roomId;

          const roomData = this.roomsMap.get(roomId);
          if (roomData && !booking.room) {
            (booking as any).room = {
              room_id: roomData.room_id,
              room_name: roomData.room_name,
              range: roomData.range,
              price: roomData.price
            };
          }
          return booking;
        });
        this.filterBookings();
      })
      .catch(err => console.error('Error loading bookings:', err));
  }

  setTab(tab: BookingStatusTab): void {
    this.activeTab = tab;
    this.filterBookings();
  }

  filterBookings(): void {
    let filtered = [...this.bookings];

    // Filter by status
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(b => b.status === this.activeTab);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.id.toLowerCase().includes(term) ||
        b.customerName.toLowerCase().includes(term) ||
        b.customerEmail.toLowerCase().includes(term) ||
        (b.room && b.room.room_name.toLowerCase().includes(term))
      );
    }

    this.filteredBookings = filtered;
  }

  onSearch(): void {
    this.filterBookings();
  }

  viewBooking(booking: Booking): void {
    this.selectedBooking = booking;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedBooking = null;
  }

  updateBookingStatus(booking: Booking, status: string): void {
    const index = this.bookings.findIndex(b => b.id === booking.id);
    if (index !== -1) {
      this.bookings[index].status = status as any;
      this.filterBookings();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      case 'no-show': return 'status-no-show';
      default: return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'no-show': return 'Không đến';
      default: return 'Chờ xác nhận';
    }
  }

  getRoomName(booking: Booking): string {
    if (booking.room && booking.room.room_name) {
      return booking.room.room_name;
    }
    const roomId = typeof booking.roomId === 'string'
      ? parseInt(booking.roomId.replace('R', ''))
      : booking.roomId;
    const roomData = this.roomsMap.get(roomId);
    return roomData ? roomData.room_name : 'N/A';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  logout(): void {
    Swal.fire({
      title: 'Xác nhận đăng xuất',
      text: 'Bạn có chắc chắn muốn đăng xuất?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#132fba',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        Swal.fire({
          title: 'Đã đăng xuất!',
          text: 'Bạn đã đăng xuất thành công.',
          icon: 'success',
          confirmButtonColor: '#132fba'
        }).then(() => {
          this.router.navigate(['/']);
        });
      }
    });
  }
}

