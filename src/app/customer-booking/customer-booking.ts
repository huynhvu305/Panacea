import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserToolbarComponent } from '../user-toolbar/user-toolbar';
import { Booking } from '../interfaces/booking';
import { AuthService } from '../services/auth';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';

type ManageTab = 'cancel' | 'reschedule';

interface RoomData {
  room_id: number;
  room_name: string;
  range: string;
  price: number;
}

@Component({
  selector: 'app-customer-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, UserToolbarComponent],
  templateUrl: './customer-booking.html',
  styleUrls: ['./customer-booking.css'],
})
export class CustomerBookingComponent implements OnInit {
  bookings: Booking[] = [];
  cancelableBookings: Booking[] = [];
  reschedulableBookings: Booking[] = [];
  roomsMap: Map<number, RoomData> = new Map();
  currentUserId: string | null = null;
  activeTab: ManageTab = 'reschedule';
  
  // Reschedule form
  selectedBookingForReschedule: Booking | null = null;
  newDate: string = '';
  newStartTime: string = '';
  showRescheduleModal: boolean = false;
  minDate: string = ''; // Ngày tối thiểu có thể chọn (hôm nay)
  
  // Detail modal
  selectedBookingForDetail: Booking | null = null;
  showDetailModal: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private seoService: SEOService
  ) {}

  ngOnInit(): void {
    // Kiểm tra và chặn admin truy cập
    if (this.authService.isLoggedIn() && this.authService.isAdmin()) {
      Swal.fire({
        icon: 'warning',
        title: 'Không được phép truy cập',
        text: 'Tài khoản admin chỉ được truy cập vào các trang quản lý. Vui lòng sử dụng tài khoản khách hàng để quản lý đặt phòng.',
        confirmButtonText: 'Về trang quản trị',
        allowOutsideClick: false
      }).then(() => {
        this.router.navigate(['/admin-dashboard']);
      });
      return;
    }

    this.seoService.updateSEO({
      title: 'Hủy Lịch / Đổi Lịch - Panacea',
      description: 'Quản lý đặt phòng của bạn - Hủy hoặc đổi lịch đặt phòng tại Panacea',
      keywords: 'Panacea, hủy lịch, đổi lịch, quản lý đặt phòng'
    });
    this.getCurrentUserId();
    this.setMinDate();
    this.loadData();
  }

  /**
   * Set ngày tối thiểu (hôm nay) để không cho chọn ngày trong quá khứ
   */
  private setMinDate(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.minDate = `${year}-${month}-${day}`;
  }

  private getCurrentUserId(): void {
    try {
      const uid = localStorage.getItem('UID');
      if (uid) {
        this.currentUserId = uid;
        return;
      }
      
      const currentUserStr = localStorage.getItem('CURRENT_USER');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        this.currentUserId = currentUser.user_id || null;
      }
    } catch (e) {
      console.error('Error getting user ID:', e);
    }
  }

  private loadData(): void {
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
        // Merge với updates từ localStorage nếu có
        const updatesStr = localStorage.getItem('BOOKINGS_UPDATES');
        if (updatesStr) {
          try {
            const updates = JSON.parse(updatesStr);
            // Merge: cập nhật bookings từ updates
            updates.forEach((updatedBooking: any) => {
              const index = data.findIndex(b => b.id === updatedBooking.id);
              if (index !== -1) {
                data[index] = { ...data[index], ...updatedBooking };
              }
            });
          } catch (e) {
            console.error('Error parsing bookings updates:', e);
          }
        }
        
        let filteredBookings = data;
        if (this.currentUserId) {
          filteredBookings = data.filter((booking: any) => 
            booking.userId === this.currentUserId
          );
        }
        
        this.bookings = filteredBookings.map(booking => {
          const roomId = typeof booking.roomId === 'string' 
            ? parseInt(booking.roomId.replace('R', '')) 
            : booking.roomId;
          
          const roomData = this.roomsMap.get(roomId);
          if (roomData && !booking.room) {
            (booking as any).room = {
              room_id: roomData.room_id,
              room_name: roomData.room_name,
              price: roomData.price,
              range: roomData.range
            };
          }
          
          return booking;
        });

        // Lọc bookings có thể hủy/đổi
        this.filterBookings();
      })
      .catch(err => console.error('Lỗi khi tải dữ liệu:', err));
  }

  private filterBookings(): void {
    const now = new Date();
    
    this.cancelableBookings = this.bookings.filter(booking => {
      // Chỉ lấy confirmed hoặc pending
      if (booking.status !== 'confirmed' && booking.status !== 'pending') {
        return false;
      }
      
      // Kiểm tra 24h trước khi bắt đầu
      return this.canModifyBooking(booking, now);
    });

    this.reschedulableBookings = [...this.cancelableBookings];
  }

  /**
   * Kiểm tra xem có thể hủy/đổi booking không (phải cách 24h trước khi bắt đầu)
   */
  private canModifyBooking(booking: Booking, now: Date): boolean {
    try {
      // Parse startTime: "12:00 10/11/2025"
      const [timePart, datePart] = booking.startTime.split(' ');
      const [hours, minutes] = timePart.split(':').map(Number);
      const [day, month, year] = datePart.split('/').map(Number);
      
      const startDateTime = new Date(year, month - 1, day, hours, minutes);
      const diffMs = startDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      // Phải cách ít nhất 24 giờ
      return diffHours >= 24;
    } catch (e) {
      console.error('Error parsing startTime:', e);
      return false;
    }
  }

  setTab(tab: ManageTab): void {
    this.activeTab = tab;
  }

  /**
   * Tính số Xu sẽ bị mất khi hủy (rewardPointsEarned)
   */
  getLostPoints(booking: Booking): number {
    return booking.rewardPointsEarned || 0;
  }

  /**
   * Hủy booking
   */
  cancelBooking(booking: Booking): void {
    const lostPoints = this.getLostPoints(booking);
    
    Swal.fire({
      title: 'Xác nhận hủy lịch',
      html: `
        <p>Bạn có chắc chắn muốn hủy đặt phòng này?</p>
        <p><strong>Phòng:</strong> ${booking.room?.room_name || 'N/A'}</p>
        <p><strong>Thời gian:</strong> ${booking.startTime} - ${booking.endTime}</p>
        ${lostPoints > 0 ? `<p class="text-danger"><strong>Bạn sẽ mất ${lostPoints.toLocaleString('vi-VN')} Xu</strong></p>` : ''}
        <p class="text-info mt-2"><strong>Lưu ý:</strong> Tiền sẽ được hoàn trong vòng 2-3 ngày làm việc.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hủy lịch',
      cancelButtonText: 'Không',
      confirmButtonColor: '#132fba',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.performCancel(booking, lostPoints);
      }
    });
  }

  private async performCancel(booking: Booking, lostPoints: number): Promise<void> {
    try {
      // Load bookings.json
      const response = await fetch('assets/data/bookings.json');
      const allBookings: any[] = await response.json();
      
      // Tìm và cập nhật booking
      const index = allBookings.findIndex(b => b.id === booking.id);
      if (index !== -1) {
        allBookings[index].status = 'cancelled';
        
        // Lưu vào localStorage để cập nhật
        this.saveBookingsUpdate(allBookings);
        
        // Trừ Xu từ user nếu có
        if (lostPoints > 0) {
          this.deductUserPoints(lostPoints);
        }
        
        // Reload data
        this.loadData();
        
        Swal.fire({
          title: 'Hủy lịch thành công!',
          html: `
            <p>Đặt phòng của bạn đã được hủy.</p>
            ${lostPoints > 0 ? `<p>Bạn đã mất ${lostPoints.toLocaleString('vi-VN')} Xu.</p>` : ''}
            <p class="text-info"><strong>Tiền sẽ được hoàn trong vòng 2-3 ngày làm việc.</strong></p>
          `,
          icon: 'success',
          confirmButtonColor: '#132fba',
          timer: 3000
        });
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể hủy lịch. Vui lòng thử lại.',
        icon: 'error'
      });
    }
  }

  /**
   * Trừ Xu từ user
   */
  private deductUserPoints(points: number): void {
    try {
      const usersStr = localStorage.getItem('USERS');
      const uid = localStorage.getItem('UID');
      
      if (usersStr && uid) {
        const users = JSON.parse(usersStr);
        const userIndex = users.findIndex((u: any) => u.user_id === uid);
        
        if (userIndex !== -1) {
          const currentCoin = users[userIndex].coin || 0;
          users[userIndex].coin = Math.max(0, currentCoin - points);
          localStorage.setItem('USERS', JSON.stringify(users));
          
          // Cập nhật CURRENT_USER
          const currentUserStr = localStorage.getItem('CURRENT_USER');
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            currentUser.coin = users[userIndex].coin;
            localStorage.setItem('CURRENT_USER', JSON.stringify(currentUser));
          }
        }
      }
    } catch (e) {
      console.error('Error deducting points:', e);
    }
  }

  /**
   * Mở modal đổi lịch
   */
  openRescheduleModal(booking: Booking): void {
    this.selectedBookingForReschedule = booking;
    
    // Parse startTime để set giá trị mặc định
    // Format: "14:00 22/11/2025" (dd/mm/yyyy)
    const [timePart, datePart] = booking.startTime.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    
    // Format date cho input type="date" (YYYY-MM-DD)
    this.newDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    this.newStartTime = timePart;
    
    this.showRescheduleModal = true;
  }

  /**
   * Format ngày từ YYYY-MM-DD sang dd/mm/yyyy
   */
  formatDateToDDMMYYYY(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Format ngày từ dd/mm/yyyy sang YYYY-MM-DD (cho input date)
   */
  formatDateToYYYYMMDD(dateStr: string): string {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.selectedBookingForReschedule = null;
    this.newDate = '';
    this.newStartTime = '';
  }

  /**
   * Tính toán endTime dựa trên startTime và duration
   */
  private calculateEndTime(startTime: string, originalStartTime: string, originalEndTime: string): string {
    try {
      // Parse original times để tính duration
      const [origTimePart, origDatePart] = originalStartTime.split(' ');
      const [origEndTimePart, origEndDatePart] = originalEndTime.split(' ');
      
      const [origHours, origMinutes] = origTimePart.split(':').map(Number);
      const [origDay, origMonth, origYear] = origDatePart.split('/').map(Number);
      const origStart = new Date(origYear, origMonth - 1, origDay, origHours, origMinutes);
      
      const [origEndHours, origEndMinutes] = origEndTimePart.split(':').map(Number);
      const [origEndDay, origEndMonth, origEndYear] = origEndDatePart.split('/').map(Number);
      const origEnd = new Date(origEndYear, origEndMonth - 1, origEndDay, origEndHours, origEndMinutes);
      
      // Tính duration (milliseconds)
      const durationMs = origEnd.getTime() - origStart.getTime();
      
      // Parse new start time
      // newDate format: YYYY-MM-DD
      const [newTimePart] = startTime.split(' ');
      const [newHours, newMinutes] = newTimePart.split(':').map(Number);
      const [newYear, newMonth, newDay] = this.newDate.split('-').map(Number);
      const newStart = new Date(newYear, newMonth - 1, newDay, newHours, newMinutes);
      
      // Tính new end time
      const newEnd = new Date(newStart.getTime() + durationMs);
      
      // Format lại
      const newEndHours = String(newEnd.getHours()).padStart(2, '0');
      const newEndMinutes = String(newEnd.getMinutes()).padStart(2, '0');
      const newEndDay = String(newEnd.getDate()).padStart(2, '0');
      const newEndMonth = String(newEnd.getMonth() + 1).padStart(2, '0');
      const newEndYear = newEnd.getFullYear();
      
      return `${newEndHours}:${newEndMinutes} ${newEndDay}/${newEndMonth}/${newEndYear}`;
    } catch (e) {
      console.error('Error calculating end time:', e);
      return originalEndTime;
    }
  }

  /**
   * Xác nhận đổi lịch
   */
  confirmReschedule(): void {
    if (!this.selectedBookingForReschedule || !this.newDate || !this.newStartTime) {
      Swal.fire({
        title: 'Lỗi',
        text: 'Vui lòng điền đầy đủ thông tin.',
        icon: 'error'
      });
      return;
    }

    // Kiểm tra ngày không được là quá khứ
    const now = new Date();
    const selectedDate = new Date(this.newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      Swal.fire({
        title: 'Lỗi',
        text: 'Ngày bắt đầu mới phải là ngày trong tương lai. Không thể chọn ngày trong quá khứ.',
        icon: 'error'
      });
      return;
    }

    // Nếu chọn ngày hôm nay, kiểm tra giờ không được là quá khứ
    if (selectedDate.getTime() === today.getTime()) {
      const [startHours, startMinutes] = this.newStartTime.split(':').map(Number);
      const selectedDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHours, startMinutes);
      
      if (selectedDateTime < now) {
        Swal.fire({
          title: 'Lỗi',
          text: 'Khi chọn ngày hôm nay, giờ bắt đầu mới phải là giờ trong tương lai. Không thể chọn giờ trong quá khứ.',
          icon: 'error'
        });
        return;
      }
    }

    // Kiểm tra lại 24h
    if (!this.canModifyBooking(this.selectedBookingForReschedule, now)) {
      Swal.fire({
        title: 'Không thể đổi lịch',
        text: 'Chỉ có thể đổi lịch trước 24 giờ so với thời gian bắt đầu.',
        icon: 'warning'
      });
      return;
    }

    // Validate giờ bắt đầu (>= 8:00)
    const [startHours, startMinutes] = this.newStartTime.split(':').map(Number);
    if (startHours < 8) {
      Swal.fire({
        title: 'Lỗi',
        text: 'Giờ bắt đầu phải từ 8:00 trở đi.',
        icon: 'error'
      });
      return;
    }

    // Format new startTime (dd/mm/yyyy)
    let [year, month, day] = this.newDate.split('-').map(Number);
    let newStartTimeFormatted = `${this.newStartTime} ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    
    // Tính duration ban đầu (milliseconds)
    const [origTimePart, origDatePart] = this.selectedBookingForReschedule.startTime.split(' ');
    const [origEndTimePart, origEndDatePart] = this.selectedBookingForReschedule.endTime.split(' ');
    const [origHours, origMinutes] = origTimePart.split(':').map(Number);
    const [origDay, origMonth, origYear] = origDatePart.split('/').map(Number);
    const originalStart = new Date(origYear, origMonth - 1, origDay, origHours, origMinutes);
    const [origEndHours, origEndMinutes] = origEndTimePart.split(':').map(Number);
    const [origEndDay, origEndMonth, origEndYear] = origEndDatePart.split('/').map(Number);
    const originalEnd = new Date(origEndYear, origEndMonth - 1, origEndDay, origEndHours, origEndMinutes);
    const durationMs = originalEnd.getTime() - originalStart.getTime();
    
    // Tính new endTime
    let newEndTime = this.calculateEndTime(
      newStartTimeFormatted,
      this.selectedBookingForReschedule.startTime,
      this.selectedBookingForReschedule.endTime
    );

    // Kiểm tra và điều chỉnh giờ kết thúc nếu vượt quá 22:00
    const [endTimePart, endDatePart] = newEndTime.split(' ');
    const [endHours, endMinutes] = endTimePart.split(':').map(Number);
    
    if (endHours > 22 || (endHours === 22 && endMinutes > 0)) {
      // Tính toán lại: đặt giờ kết thúc là 22:00 và điều chỉnh giờ bắt đầu ngược lại
      const [endDay, endMonth, endYear] = endDatePart.split('/').map(Number);
      
      // Đặt giờ kết thúc là 22:00
      const maxEndTime = new Date(endYear, endMonth - 1, endDay, 22, 0);
      
      // Tính lại giờ bắt đầu: maxEndTime - duration
      const adjustedStartTime = new Date(maxEndTime.getTime() - durationMs);
      
      // Kiểm tra lại giờ bắt đầu mới có >= 8:00 không
      if (adjustedStartTime.getHours() < 8) {
        Swal.fire({
          title: 'Lỗi',
          text: 'Không thể đổi lịch vì khoảng thời gian này sẽ vượt quá giờ hoạt động (8:00 - 22:00).',
          icon: 'error'
        });
        return;
      }
      
      // Format lại (dd/mm/yyyy)
      const adjustedStartHours = String(adjustedStartTime.getHours()).padStart(2, '0');
      const adjustedStartMinutes = String(adjustedStartTime.getMinutes()).padStart(2, '0');
      const adjustedStartDay = String(adjustedStartTime.getDate()).padStart(2, '0');
      const adjustedStartMonth = String(adjustedStartTime.getMonth() + 1).padStart(2, '0');
      const adjustedStartYear = adjustedStartTime.getFullYear();
      
      // Cập nhật lại giá trị input để người dùng thấy sự thay đổi (YYYY-MM-DD cho input date)
      this.newStartTime = `${adjustedStartHours}:${adjustedStartMinutes}`;
      this.newDate = `${adjustedStartYear}-${adjustedStartMonth}-${adjustedStartDay}`;
      
      // Cập nhật lại biến để hiển thị trong confirmation (dd/mm/yyyy)
      newStartTimeFormatted = `${adjustedStartHours}:${adjustedStartMinutes} ${adjustedStartDay}/${adjustedStartMonth}/${adjustedStartYear}`;
      newEndTime = `22:00 ${String(endDay).padStart(2, '0')}/${String(endMonth).padStart(2, '0')}/${endYear}`;
      
      // Thông báo cho người dùng biết đã tự động điều chỉnh
      Swal.fire({
        title: 'Đã tự động điều chỉnh',
        html: `
          <p>Giờ kết thúc vượt quá 22:00 nên hệ thống đã tự động điều chỉnh:</p>
          <p><strong>Giờ bắt đầu mới:</strong> ${newStartTimeFormatted}</p>
          <p><strong>Giờ kết thúc:</strong> ${newEndTime}</p>
        `,
        icon: 'info',
        confirmButtonText: 'Tiếp tục',
        showCancelButton: false
      }).then(() => {
        // Sau khi người dùng xác nhận, tiếp tục với confirmation dialog
        this.showRescheduleConfirmation(newStartTimeFormatted, newEndTime);
      });
      return;
    }
    
    // Nếu không cần điều chỉnh, hiển thị confirmation bình thường
    this.showRescheduleConfirmation(newStartTimeFormatted, newEndTime);
  }

  /**
   * Hiển thị dialog xác nhận đổi lịch
   */
  private showRescheduleConfirmation(newStartTimeFormatted: string, newEndTime: string): void {
    if (!this.selectedBookingForReschedule) return;

    Swal.fire({
      title: 'Xác nhận đổi lịch',
      html: `
        <p>Bạn có chắc chắn muốn đổi lịch này?</p>
        <p><strong>Thời gian cũ:</strong> ${this.selectedBookingForReschedule.startTime} - ${this.selectedBookingForReschedule.endTime}</p>
        <p><strong>Thời gian mới:</strong> ${newStartTimeFormatted} - ${newEndTime}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đổi lịch',
      cancelButtonText: 'Hủy',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.performReschedule(newStartTimeFormatted, newEndTime);
      }
    });
  }

  private async performReschedule(newStartTime: string, newEndTime: string): Promise<void> {
    if (!this.selectedBookingForReschedule) return;

    try {
      const response = await fetch('assets/data/bookings.json');
      const allBookings: any[] = await response.json();
      
      const index = allBookings.findIndex(b => b.id === this.selectedBookingForReschedule!.id);
      if (index !== -1) {
        allBookings[index].startTime = newStartTime;
        allBookings[index].endTime = newEndTime;
        
        // Lưu vào localStorage để cập nhật
        this.saveBookingsUpdate(allBookings);
        
        // Reload data
        this.loadData();
        this.closeRescheduleModal();
        
        Swal.fire({
          title: 'Đổi lịch thành công!',
          text: 'Lịch đặt phòng của bạn đã được cập nhật.',
          icon: 'success',
          confirmButtonColor: '#132fba',
          timer: 2000
        });
      }
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể đổi lịch. Vui lòng thử lại.',
        icon: 'error'
      });
    }
  }

  /**
   * Lưu cập nhật bookings vào localStorage
   */
  private saveBookingsUpdate(bookings: any[]): void {
    try {
      localStorage.setItem('BOOKINGS_UPDATES', JSON.stringify(bookings));
    } catch (e) {
      console.error('Error saving bookings update:', e);
    }
  }

  /**
   * Mở modal xem chi tiết
   */
  openDetailModal(booking: Booking): void {
    this.selectedBookingForDetail = booking;
    this.showDetailModal = true;
  }

  /**
   * Đóng modal xem chi tiết
   */
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedBookingForDetail = null;
  }

  /**
   * Helper methods cho modal detail
   */
  getRoomName(b: Booking): string {
    const roomName = (b as any)?.room?.room_name || (b as any)?.room?.name;
    if (roomName) return roomName;
    
    const roomId = typeof b.roomId === 'string' 
      ? parseInt(b.roomId.replace('R', '')) 
      : b.roomId;
    const roomData = this.roomsMap.get(roomId);
    return roomData?.room_name || '—';
  }

  formatCurrency(value: number): string {
    return (value || 0).toLocaleString('vi-VN') + ' ₫';
  }

  getServiceTotalPrice(service: any): number {
    const quantity = service.quantity || 1;
    return service.price * quantity;
  }

  getTotalServicesPrice(booking: Booking): number {
    if (!booking.services || booking.services.length === 0) return 0;
    return booking.services.reduce((sum, s) => sum + this.getServiceTotalPrice(s), 0);
  }

  getSubtotal(booking: Booking): number {
    const basePrice = booking.basePrice || 0;
    const servicesPrice = this.getTotalServicesPrice(booking);
    return basePrice + servicesPrice;
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
}

