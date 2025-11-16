import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { InvoiceService } from '../services/invoice';
import { ServiceDataService } from '../services/service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth';
import { SEOService } from '../services/seo.service';

// DB
import bookingData from '../../assets/data/bookings.json';
import voucherData from '../../assets/data/voucher.json';
import roomData from '../../assets/data/rooms.json';
import { ChangeDetectorRef } from '@angular/core';


import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { LOCALE_ID } from '@angular/core';
registerLocaleData(localeVi);

@Component({
  selector: 'app-payment',
  standalone: true,
  templateUrl: './payment.html',
  styleUrls: ['./payment.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  providers: [{ provide: LOCALE_ID, useValue: 'vi-VN' }]
})
export class Payment implements OnInit, OnDestroy {
  currentUser: any;
  isLoggedIn = false;
  bookingForMe = true;

  isSelfBooking: boolean = true;

  booking: any = null;
  bookings: any[] = [];
  roomInfo: any = null;
  vouchers: any[] = voucherData;

  header: any = null;
  headerSteps = [
    { id: 1, name: 'Xem lại' },
    { id: 2, name: 'Thanh toán' },
  ];
  currentStep = 1;

  basePrice = 0;
  totalPrice = 0;
  originalPrice = 0;
  discountValue = 0;
  discountMessage = '';

  showPriceDetails = false;
  promoCode = '';
  // Cứ 1000 VND = 1 Xu (làm tròn xuống)
  get rewardPoints(): number {
    return Math.floor(this.totalPrice / 1000);
  }
  agreedRules = false;
  showAgreeRequired = false;
  contactForm!: FormGroup;

  roomRules: any[] = [];

  expertServices: any[] = [];
  extraServices: any[] = [];
  showAllExperts: boolean = false;
  showAllExtras: boolean = false;

  usePoints: boolean = false;
  private userPoints: number = 0;
  private pointsApplied: boolean = false;
  pointsDiscountValue: number = 0; // Public để dùng trong template
  pointsLocked: boolean = false; // Public để dùng trong template

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private thanhToanService: InvoiceService,
    private cdr: ChangeDetectorRef,
    private serviceData: ServiceDataService,
    private http: HttpClient,
    private authService: AuthService,
    private seoService: SEOService
  ) {}

  ngOnInit(): void {
    // Kiểm tra và chặn admin truy cập trang payment
    if (this.authService.isLoggedIn() && this.authService.isAdmin()) {
      Swal.fire({
        icon: 'warning',
        title: 'Không được phép truy cập',
        text: 'Tài khoản admin chỉ được truy cập vào các trang quản lý. Vui lòng sử dụng tài khoản khách hàng để đặt phòng.',
        confirmButtonText: 'Về trang quản trị',
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/admin-dashboard']);
        }
      });
      return;
    }

    // SEO
    this.seoService.updateSEO({
      title: 'Thanh Toán - Panacea',
      description: 'Thanh toán đơn hàng Panacea an toàn và nhanh chóng với nhiều phương thức thanh toán đa dạng.',
      keywords: 'Thanh toán Panacea, payment Panacea, checkout Panacea',
      robots: 'noindex, nofollow'
    });
    
    window.scrollTo(0, 0);
    
    this.initForm();
    
    // Nếu có paymentState (quay lại từ Banking), restore form ngay lập tức (không cần đợi services)
    const paymentStateStr = localStorage.getItem('paymentState');
    const hasPaymentState = !!paymentStateStr;
    
    if (hasPaymentState) {
      try {
        const paymentState = JSON.parse(paymentStateStr!);
        if (paymentState.contactForm) {
          const contactFormValue = paymentState.contactForm;
          const fullName = contactFormValue.fullName || 
                          (contactFormValue.lastName && contactFormValue.firstName 
                            ? `${contactFormValue.lastName} ${contactFormValue.firstName}`.trim()
                            : '');
          
          this.contactForm.patchValue({
            fullName: fullName || contactFormValue.fullName || '',
            phone: contactFormValue.phone || '',
            email: contactFormValue.email || '',
            saveInfo: contactFormValue.saveInfo || false,
          });
        }
        
        // Restore checkbox "Tôi đặt chỗ cho chính mình"
        if (paymentState.isSelfBooking !== undefined) {
          this.isSelfBooking = paymentState.isSelfBooking;
        }
      } catch (e) {
        console.warn('Không thể parse paymentState trong ngOnInit:', e);
      }
    }
    
    this.loadData();
    this.loadRoomRules();
    this.loadServices();
    this.updateContactValidators();
    
    this.patchRedeemRecalculation();
  }

  initForm(): void {
    this.contactForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9._-]*@gmail\.com$/)]],
      saveInfo: [false],
    });
  }

  private parseDateTime(str: string): { dateObj: Date, timeStr: string } {
    if (!str) return { dateObj: new Date(), timeStr: '' };
    const [timePart, datePart] = str.split(' ');
    if (!timePart || !datePart) return { dateObj: new Date(str), timeStr: '' };
    const [hour, minute] = timePart.split(':').map(Number);
    const [day, month, year] = datePart.split('/').map(Number);
    const d = new Date(year, month - 1, day, hour, minute);
    return { dateObj: d, timeStr: timePart };
  }

  loadData(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    
    if (this.isLoggedIn) {
      const uid = localStorage.getItem('UID');
      const usersStr = localStorage.getItem('USERS');
      
      if (uid && usersStr) {
        try {
          const users = JSON.parse(usersStr);
          const user = users.find((u: any) => u.user_id === uid);
          
          if (user) {
            this.currentUser = {
              id: user.user_id,
              user_id: user.user_id,
              full_name: user.full_name || '',
              email: user.email || '',
              phone_number: user.phone_number || '',
              phone: user.phone_number || '',
              point: user.coin || 0,
              coin: user.coin || 0,
              star: user.star || 0
            };
            this.isLoggedIn = true;
          }
        } catch (e) {
          console.warn('Không thể parse users từ localStorage:', e);
        }
      }
      
      // Fallback: thử lấy từ CURRENT_USER
      if (!this.currentUser) {
        const currentUserStr = localStorage.getItem('CURRENT_USER');
        if (currentUserStr) {
          try {
            const user = JSON.parse(currentUserStr);
            this.currentUser = {
              id: user.user_id,
              user_id: user.user_id,
              full_name: user.full_name || '',
              email: user.email || '',
              phone_number: user.phone_number || '',
              phone: user.phone_number || '',
              point: user.coin || 0,
              coin: user.coin || 0,
              star: user.star || 0
            };
            this.isLoggedIn = true;
          } catch (e) {
            console.warn('Không thể parse CURRENT_USER:', e);
          }
        }
      }
    }
    
    // Fallback: sử dụng InvoiceService nếu chưa có dữ liệu
    if (!this.currentUser) {
      this.thanhToanService.getUser().subscribe({
        next: (res: any) => {
          if (res) {
            this.currentUser = res;
            this.isLoggedIn = this.authService.isLoggedIn() || !!(res && (res.full_name || res.email || res.id));
          }
        },
        error: () => {
          // Ignore
        }
      });
    }
    
    // Tiếp tục xử lý logic còn lại
    if (this.currentUser) {

      // Nếu có paymentState (quay lại từ Banking), restore từ paymentState (KHÔNG điền từ user)
      // Nếu không có paymentState (lần đầu load), mới điền từ user (nếu đã đăng nhập)
      const paymentStateStr = localStorage.getItem('paymentState');
      const hasPaymentState = !!paymentStateStr;
      
      if (!hasPaymentState) {
        // Nếu đã đăng nhập, mặc định tick "Tôi đặt phòng cho chính mình" và tự động điền form
        if (this.isLoggedIn && this.currentUser) {
          this.isSelfBooking = true;
          
          const fullName = this.currentUser.full_name || '';
          this.contactForm.patchValue({
            fullName: fullName,
            phone: this.currentUser.phone_number || this.currentUser.phone || '',
            email: this.currentUser.email || '',
          });
        } else {
          this.isSelfBooking = false;
        }
        this.updateContactValidators();
      } else {
        // Không điền form từ user (form đã được restore trong ngOnInit)
        // Chỉ cập nhật validator (không ghi đè form)
        this.updateContactValidators();
      }

        // (sử dụng lại biến paymentStateStr và hasPaymentState đã khai báo ở trên)
        let hasPaymentStatePoints = false;
        
        if (hasPaymentState && paymentStateStr) {
          try {
            const paymentState = JSON.parse(paymentStateStr);
            // Nếu đã dùng 50 Xu và có lưu userPoints, dùng giá trị đó
            if (paymentState.usePoints === true && paymentState.userPoints !== undefined) {
              this.userPoints = paymentState.userPoints;
              hasPaymentStatePoints = true;
              // Cập nhật lại currentUser.point để đồng bộ (nếu đã đăng nhập)
              if (this.currentUser) {
                this.currentUser.point = paymentState.userPoints;
              }
            }
          } catch (e) {
            console.warn('Không thể parse paymentState:', e);
          }
        }
        
        // Nếu chưa có paymentState points, lấy từ users.json
        if (!hasPaymentStatePoints) {
          if (this.isLoggedIn && this.currentUser) {
            const possiblePoints = this.currentUser.point;
            const parsed = Number.isFinite(Number(possiblePoints)) ? Number(possiblePoints) : NaN;
            if (!Number.isNaN(parsed)) {
              this.userPoints = parsed;
            } else {
              this.userPoints = 0; // Mặc định 0 nếu không có
            }
          } else {
            this.userPoints = 0; // Chưa đăng nhập thì không có points
          }
        }
        
        this.cdr.detectChanges();
    }

    // Đảm bảo 2 luồng không xung đột với nhau
    let selectedBooking: any = null;
    const processedBookingsStr = localStorage.getItem('processedBookings');
    const bookingFromStorage = localStorage.getItem('selectedBooking');
    
    if (processedBookingsStr) {
      try {
        const processedBookings = JSON.parse(processedBookingsStr);
        if (Array.isArray(processedBookings) && processedBookings.length > 0) {
          // Kiểm tra từng booking xem có đặt trước 30 phút không
          const invalidBookings: any[] = [];
          for (const booking of processedBookings) {
            if (!this.isAtLeast30MinutesBefore(booking.date, booking.time)) {
              invalidBookings.push(booking);
            }
          }
          
          if (invalidBookings.length > 0) {
            const [firstInvalid] = invalidBookings;
            const [startTime] = firstInvalid.time.split(' - ');
            Swal.fire({
              icon: 'error',
              title: 'Chưa đặt trước 30 phút',
              text: `Phòng "${firstInvalid.roomName}" với khung giờ ${startTime.trim()} đã không còn đủ thời gian để đặt (phải đặt trước ít nhất 30 phút so với giờ check-in). Vui lòng quay lại và chọn phòng khác.`,
              confirmButtonText: 'Đã hiểu',
              confirmButtonColor: '#132fba'
            }).then(() => {
              // Xóa processedBookings và quay lại trang trước
              localStorage.removeItem('processedBookings');
              this.router.navigate(['/room-list']);
            });
            return;
          }
          
          // Chuyển đổi cart items thành booking objects
          this.loadMultipleBookings(processedBookings);
          return; // Return ngay để không chạy code phía dưới
        }
      } catch (error) {
        console.warn('Không thể parse processedBookings:', error);
      }
    }
    
    if (bookingFromStorage) {
      try {
        const bookingInfo = JSON.parse(bookingFromStorage);
        
        // Kiểm tra xem có đặt trước 30 phút không
        if (!this.isAtLeast30MinutesBefore(bookingInfo.date, bookingInfo.time)) {
          const [startTime] = bookingInfo.time.split(' - ');
          Swal.fire({
            icon: 'error',
            title: 'Chưa đặt trước 30 phút',
            text: `Phòng "${bookingInfo.roomName}" với khung giờ ${startTime.trim()} đã không còn đủ thời gian để đặt (phải đặt trước ít nhất 30 phút so với giờ check-in). Vui lòng quay lại và chọn phòng khác.`,
            confirmButtonText: 'Đã hiểu',
            confirmButtonColor: '#132fba'
          }).then(() => {
            // Xóa selectedBooking và quay lại trang trước
            localStorage.removeItem('selectedBooking');
            this.router.navigate(['/room-list']);
          });
          return;
        }
        
        const roomId = bookingInfo.roomId;
        
        this.http.get<any[]>('assets/data/rooms.json').subscribe((rooms) => {
          const roomFromData = rooms.find((r: any) => String(r.room_id ?? r.id ?? r.roomId) === String(roomId));

          if (roomFromData) {
            // Tạo booking object từ dữ liệu room-detail
            const [timeStart, timeEnd] = bookingInfo.time ? bookingInfo.time.split(' - ') : ['14:00', '15:00'];
            const bookingDate = bookingInfo.date ? new Date(bookingInfo.date) : new Date();
            
            selectedBooking = {
              id: 'BK_FROM_ROOM_DETAIL',
              roomId: String(roomId),
              room: roomFromData,
              checkInDate: bookingDate,
              checkInTime: timeStart,
              checkOutTime: timeEnd,
              startTime: `${timeStart} ${bookingInfo.date || ''}`,
              endTime: `${timeEnd} ${bookingInfo.date || ''}`,
              services: [],
              expertServices: bookingInfo.expertServices || [],
              extraServices: bookingInfo.extraServices || [],
              totalPrice: bookingInfo.totalPrice || bookingInfo.basePrice || 0,
              cancelBefore: null as any,
              rescheduleBefore: null as any,
            };

            // Cập nhật roomInfo với dữ liệu đầy đủ từ rooms.json (bao gồm range)
            this.roomInfo = roomFromData;
            
            // Cập nhật header
            const roomName = bookingInfo.roomName || roomFromData.room_name || roomFromData.name || 'Đặt phòng';
            this.header = {
              title: roomName,
              rating: roomFromData.rating ?? 0,
              reviews: roomFromData.reviews ?? 0,
            };

            // Cập nhật giá phòng (chưa bao gồm dịch vụ)
            this.basePrice = bookingInfo.basePrice || roomFromData.price || roomFromData.pricePerHour || 0;
            this.originalPrice = this.basePrice;
            // Lưu ý: totalPrice sẽ được tính lại trong calculateTotal() sau khi đồng bộ dịch vụ
            // Tạm thời set giá phòng cơ bản
            this.totalPrice = this.basePrice;

            // Tính ngày hủy / đổi miễn phí
            if (bookingDate instanceof Date) {
              const cancelBefore = new Date(bookingDate);
              cancelBefore.setDate(cancelBefore.getDate() - 1);
              selectedBooking.cancelBefore = cancelBefore;

              const rescheduleBefore = new Date(bookingDate);
              rescheduleBefore.setDate(rescheduleBefore.getDate() - 1);
              selectedBooking.rescheduleBefore = rescheduleBefore;
            }

            this.booking = selectedBooking;
            // Không restore ở đây, sẽ restore sau khi loadServices() hoàn thành
            this.calculateTotal();
            this.cdr.detectChanges();
          } else {
            // Fallback: nếu không tìm thấy trong rooms.json, dùng roomData
            this.loadRoomFromRoomData(bookingInfo, roomId);
          }
        }, (error) => {
          console.warn('Không thể load rooms.json, dùng roomData fallback:', error);
          // Fallback: nếu không load được rooms.json, dùng roomData
          try {
            const bookingInfo = JSON.parse(bookingFromStorage);
            this.loadRoomFromRoomData(bookingInfo, bookingInfo.roomId);
          } catch (e) {
            console.warn('Không thể parse bookingInfo:', e);
          }
        });
        return; // Return ngay để không chạy code phía dưới
      } catch (error) {
        console.warn('Không thể parse selectedBooking từ localStorage:', error);
      }
    }

    // Nếu không có dữ liệu từ localStorage, dùng dữ liệu cố định
    if (!selectedBooking) {
      if (Array.isArray(bookingData)) {
        selectedBooking = bookingData.find((b: any) => b.id === 'BK002') || bookingData[0];
      } else {
        selectedBooking = bookingData;
      }
      
      if (selectedBooking) {
        if (selectedBooking.startTime && selectedBooking.endTime) {
          const startParsed = this.parseDateTime(selectedBooking.startTime);
          const endParsed = this.parseDateTime(selectedBooking.endTime);
          (selectedBooking as any).checkInDate = startParsed.dateObj;
          selectedBooking.checkInTime = startParsed.timeStr;
          selectedBooking.checkOutTime = endParsed.timeStr;
        }

        this.roomInfo = selectedBooking.room
          ? selectedBooking.room
          : (Array.isArray(roomData) ? roomData : [roomData]).find(
              (r: any) => String(r.id ?? r.roomId) === String(selectedBooking.roomId)
            );

        if (this.roomInfo) {
          this.header = {
            title: this.roomInfo.name ?? 'Đặt phòng',
            rating: this.roomInfo.rating ?? 0,
            reviews: this.roomInfo.reviews ?? 0,
          };

          this.basePrice = this.roomInfo.price ?? (this.roomInfo as any).pricePerHour ?? 0;
          this.originalPrice = this.basePrice;
          this.totalPrice = this.basePrice;
        }

        selectedBooking.services = (selectedBooking.services || []).map((s: any) => ({
          ...s,
          active: !!s.active,
        }));

        const checkInDate = (selectedBooking as any).checkInDate;
        if (checkInDate instanceof Date) {
          const cancelBefore = new Date(checkInDate);
          cancelBefore.setDate(cancelBefore.getDate() - 1);
          (selectedBooking as any).cancelBefore = cancelBefore;

          const rescheduleBefore = new Date(checkInDate);
          rescheduleBefore.setDate(rescheduleBefore.getDate() - 1);
          (selectedBooking as any).rescheduleBefore = rescheduleBefore;
        }

        if (selectedBooking.voucherCode) {
          this.promoCode = String(selectedBooking.voucherCode).trim();
          this.applyCoupon();
        }
      }
    }

    this.booking = selectedBooking;
    if (selectedBooking && this.bookings.length === 0) {
      this.bookings = [selectedBooking]; // Chuyển thành array để đồng nhất
    }
    
    if (!this.booking && this.bookings.length === 0) return;

    // Không restore ở đây, sẽ restore sau khi loadServices() hoàn thành
    this.calculateTotal();
  }
  
  private restorePaymentState(): void {
    const paymentStateStr = localStorage.getItem('paymentState');
    if (!paymentStateStr) return;
    
    try {
      const paymentState = JSON.parse(paymentStateStr);
      
      this.expertServices.forEach(ex => {
        ex.selected = false;
      });
      this.extraServices.forEach(ext => {
        ext.selected = false;
        // Giữ nguyên quantity (không reset về 1 khi restore)
      });
      
      // Chỉ restore những dịch vụ có selected = true trong paymentState
      if (paymentState.expertServices && Array.isArray(paymentState.expertServices)) {
        paymentState.expertServices.forEach((saved: any) => {
          // Chỉ restore những dịch vụ có selected = true (đã được tick bởi user)
          if (saved.selected === true) {
            // Tìm dịch vụ theo id (so sánh string để tránh lỗi type)
            const found = this.expertServices.find(ex => {
              // So sánh id (string hoặc number)
              if (saved.id !== undefined && ex.id !== undefined) {
                return String(ex.id) === String(saved.id);
              }
              // Fallback: so sánh name nếu id không khớp
              if (saved.name && ex.name) {
                return ex.name === saved.name;
              }
              return false;
            });
            if (found) {
              found.selected = true;
            }
          }
        });
      }
      
      // Chỉ restore những dịch vụ có selected = true trong paymentState
      if (paymentState.extraServices && Array.isArray(paymentState.extraServices)) {
        paymentState.extraServices.forEach((saved: any) => {
          // Chỉ restore những dịch vụ có selected = true (đã được tick bởi user)
          if (saved.selected === true) {
            // Tìm dịch vụ theo id (so sánh string để tránh lỗi type)
            const found = this.extraServices.find(ext => {
              // So sánh id (string hoặc number)
              if (saved.id !== undefined && ext.id !== undefined) {
                return String(ext.id) === String(saved.id);
              }
              // Fallback: so sánh name nếu id không khớp
              if (saved.name && ext.name) {
                return ext.name === saved.name;
              }
              return false;
            });
            if (found) {
              found.selected = true;
              found.quantity = saved.quantity || 1;
            }
          }
        });
      }
      
      // Khôi phục mã giảm giá (restore giá trị đã lưu)
      if (paymentState.promoCode !== undefined) {
        this.promoCode = paymentState.promoCode || '';
        if (paymentState.promoCode && paymentState.isCouponValid) {
          // Restore trạng thái mã giảm giá đã lưu
          this.isCouponValid = paymentState.isCouponValid;
          this.discountValue = paymentState.discountValue || 0;
          this.discountMessage = paymentState.discountMessage || '';
        } else {
          // Nếu không có mã hoặc mã không hợp lệ, reset
          this.isCouponValid = false;
          this.discountValue = 0;
          this.discountMessage = '';
        }
      }
      
      // Khôi phục Redeem Xu
      if (paymentState.usePoints !== undefined) {
        this.usePoints = paymentState.usePoints;
        this.pointsDiscountValue = paymentState.pointsDiscountValue || 0;
        this.pointsLocked = paymentState.pointsLocked || false;
        this.pointsApplied = paymentState.pointsApplied || false;
      }
      
      // Điều này đảm bảo khi quay lại từ Banking, số Xu hiển thị đúng (20 Xu thay vì 120 Xu)
      if (paymentState.userPoints !== undefined && paymentState.usePoints === true) {
        // Nếu đã dùng 50 Xu, restore số Xu đã bị trừ
        this.userPoints = paymentState.userPoints;
        // Cập nhật lại currentUser.point để đồng bộ
        if (this.currentUser) {
          this.currentUser.point = paymentState.userPoints;
        }
      }
      
      // Restore form TRƯỚC khi update validators để đảm bảo dữ liệu được khôi phục đúng
      if (paymentState.contactForm) {
        // Hỗ trợ cả fullName (mới) và lastName/firstName (cũ) để tương thích ngược
        const contactFormValue = paymentState.contactForm;
        const fullName = contactFormValue.fullName || 
                        (contactFormValue.lastName && contactFormValue.firstName 
                          ? `${contactFormValue.lastName} ${contactFormValue.firstName}`.trim()
                          : '');
        
        this.contactForm.patchValue({
          fullName: fullName || contactFormValue.fullName || '',
          phone: contactFormValue.phone || '',
          email: contactFormValue.email || '',
          saveInfo: contactFormValue.saveInfo || false,
        });
      }
      
      // Khôi phục checkbox "Tôi đặt chỗ cho chính mình"
      if (paymentState.isSelfBooking !== undefined) {
        this.isSelfBooking = paymentState.isSelfBooking;
      }
      
      this.updateContactValidators();
      
      // Cập nhật danh sách dịch vụ đã chọn
      this.updateSelectedServices();
      
      if (this.usePoints) {
        const el = document.getElementById('usePoints') as HTMLInputElement | null;
        if (el) {
          el.checked = true;
        }
      }
      
    } catch (error) {
      console.warn('Không thể khôi phục trạng thái payment:', error);
    }
  }
  
  private savePaymentState(): void {
    // Cập nhật danh sách dịch vụ đã chọn TRƯỚC KHI lưu (đảm bảo lưu trạng thái hiện tại)
    this.updateSelectedServices();
    
    // Đảm bảo lưu đúng trạng thái user đã thay đổi, không phải từ bookings
    // Lưu cả selected = false để khi restore, chỉ restore những dịch vụ có selected = true
    const paymentState = {
      expertServices: this.expertServices.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        description: s.description,
        selected: Boolean(s.selected), // Lưu trạng thái CHÍNH XÁC (true/false)
      })),
      extraServices: this.extraServices.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        description: s.description,
        selected: Boolean(s.selected), // Lưu trạng thái CHÍNH XÁC (true/false)
        quantity: s.quantity || 1
      })),
      promoCode: this.promoCode,
      usePoints: this.usePoints,
      pointsDiscountValue: this.pointsDiscountValue,
      pointsLocked: this.pointsLocked,
      pointsApplied: this.pointsApplied,
      userPoints: this.userPoints,
      contactForm: this.contactForm.value,
      isSelfBooking: this.isSelfBooking,
      discountValue: this.discountValue,
      isCouponValid: this.isCouponValid,
      discountMessage: this.discountMessage,
    };
    
    localStorage.setItem('paymentState', JSON.stringify(paymentState));
  }

  private loadRoomFromRoomData(bookingInfo: any, roomId: any): void {
    const roomFromData = (Array.isArray(roomData) ? roomData : [roomData]).find(
      (r: any) => String(r.room_id ?? r.id ?? r.roomId) === String(roomId)
    );

    if (roomFromData) {
      const [timeStart, timeEnd] = bookingInfo.time ? bookingInfo.time.split(' - ') : ['14:00', '15:00'];
      const bookingDate = bookingInfo.date ? new Date(bookingInfo.date) : new Date();
      
      const selectedBooking = {
        id: 'BK_FROM_ROOM_DETAIL',
        roomId: String(roomId),
        room: roomFromData,
        checkInDate: bookingDate,
        checkInTime: timeStart,
        checkOutTime: timeEnd,
        startTime: `${timeStart} ${bookingInfo.date || ''}`,
        endTime: `${timeEnd} ${bookingInfo.date || ''}`,
        services: [],
        expertServices: bookingInfo.expertServices || [],
        extraServices: bookingInfo.extraServices || [],
        totalPrice: bookingInfo.totalPrice || bookingInfo.basePrice || 0,
        cancelBefore: null as any,
        rescheduleBefore: null as any,
      };

      // Cập nhật roomInfo
      this.roomInfo = roomFromData;
      
      // Cập nhật header
      const roomName = bookingInfo.roomName || (roomFromData as any).room_name || (roomFromData as any).name || 'Đặt phòng';
      this.header = {
        title: roomName,
        rating: roomFromData.rating ?? 0,
        reviews: roomFromData.reviews ?? 0,
      };

      // Cập nhật giá phòng
      this.basePrice = bookingInfo.basePrice || roomFromData.price || (roomFromData as any).pricePerHour || 0;
      this.originalPrice = this.basePrice;
      this.totalPrice = this.basePrice;

      // Tính ngày hủy / đổi miễn phí
      if (bookingDate instanceof Date) {
        const cancelBefore = new Date(bookingDate);
        cancelBefore.setDate(cancelBefore.getDate() - 1);
        selectedBooking.cancelBefore = cancelBefore;

        const rescheduleBefore = new Date(bookingDate);
        rescheduleBefore.setDate(rescheduleBefore.getDate() - 1);
        selectedBooking.rescheduleBefore = rescheduleBefore;
      }

      this.booking = selectedBooking;
      // Không restore ở đây, sẽ restore sau khi loadServices() hoàn thành
      this.calculateTotal();
      this.cdr.detectChanges();
    }
  }

  private combineDateTime(dateStr?: string, timeStr?: string): Date {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
    let hh = 0,
      mm = 0;
    if (timeStr && timeStr.includes(':')) {
      [hh, mm] = timeStr.split(':').map((v) => parseInt(v, 10));
    }
    return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
  }

  /**
   * Kiểm tra xem thời gian check-in có cách hiện tại ít nhất 30 phút không
   * @param dateStr Ngày check-in (format: YYYY-MM-DD)
   * @param timeStr Khung giờ check-in (format: "HH:MM - HH:MM")
   * @returns true nếu cách hiện tại ít nhất 30 phút, false nếu không
   */
  private isAtLeast30MinutesBefore(dateStr: string, timeStr: string): boolean {
    if (!dateStr || !timeStr) return false;
    
    try {
      // Parse time slot (ví dụ: "09:00 - 10:00") - lấy giờ bắt đầu
      const [startTime] = timeStr.split(' - ');
      const [hours, minutes] = startTime.trim().split(':').map(Number);
      
      // Parse date
      const selectedDate = new Date(dateStr);
      selectedDate.setHours(hours, minutes, 0, 0);
      
      const now = new Date();
      
      // Nếu chọn ngày khác hôm nay → luôn hợp lệ (đặt trước)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(selectedDate);
      checkInDate.setHours(0, 0, 0, 0);
      
      if (checkInDate > today) {
        return true; // Đặt cho ngày mai trở đi → luôn OK
      }
      
      // Nếu chọn hôm nay → kiểm tra có cách ít nhất 30 phút không
      const timeDifferenceMs = selectedDate.getTime() - now.getTime();
      const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);
      
      // Phải cách ít nhất 30 phút
      return timeDifferenceMinutes >= 30;
    } catch (e) {
      console.error('Error checking 30 minutes before:', e);
      return false;
    }
  }

  loadRoomRules(): void {
    this.roomRules = [
      {
        icon: 'bi bi-heart-pulse',
        title: 'Sức khỏe',
        description: 'Người chơi cần đảm bảo sức khỏe ổn định trước khi tham gia.',
      },
      {
        icon: 'bi bi-person-plus-fill',
        title: 'Độ tuổi',
        description:
          'Trò chơi phù hợp cho người từ 16 tuổi trở lên. Dưới 16 cần có người lớn đi kèm.',
      },
      {
        icon: 'bi bi-shield-check',
        title: 'An toàn đạo cụ',
        description: 'Không phá hoại hoặc sử dụng lực mạnh lên đạo cụ trong phòng.',
      },
      {
        icon: 'bi bi-people-fill',
        title: 'Số lượng',
        description:
          'Mỗi phòng có giới hạn số người tham gia, vui lòng tuân thủ quy định.',
      },
    ];
  }

  loadMultipleBookings(processedBookings: any[]): void {
    // Validate lại một lần nữa trước khi load (để đảm bảo)
    const invalidBookings: any[] = [];
    for (const item of processedBookings) {
      if (!this.isAtLeast30MinutesBefore(item.date, item.time)) {
        invalidBookings.push(item);
      }
    }
    
    if (invalidBookings.length > 0) {
      const [firstInvalid] = invalidBookings;
      const [startTime] = firstInvalid.time.split(' - ');
      Swal.fire({
        icon: 'error',
        title: 'Chưa đặt trước 30 phút',
        text: `Phòng "${firstInvalid.roomName}" với khung giờ ${startTime.trim()} đã không còn đủ thời gian để đặt (phải đặt trước ít nhất 30 phút so với giờ check-in). Vui lòng quay lại và chọn phòng khác.`,
        confirmButtonText: 'Đã hiểu',
        confirmButtonColor: '#132fba'
      }).then(() => {
        localStorage.removeItem('processedBookings');
        this.router.navigate(['/room-list']);
      });
      return;
    }
    
    // Load rooms.json để lấy thông tin đầy đủ về phòng
    this.http.get<any[]>('assets/data/rooms.json').subscribe((rooms) => {
      const bookingsList: any[] = [];
      let totalBasePrice = 0;
      
      processedBookings.forEach((item, index) => {
        const roomId = item.roomId;
        const roomFromData = rooms.find((r: any) => String(r.room_id ?? r.id ?? r.roomId) === String(roomId));
        
        if (roomFromData) {
          // Parse thời gian
          const [timeStart, timeEnd] = item.time ? item.time.split(' - ').map((t: string) => t.trim()) : ['14:00', '15:00'];
          const bookingDate = item.date ? new Date(item.date) : new Date();
          
          // Tính số giờ
          const toMinutes = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
          };
          const startMinutes = toMinutes(timeStart);
          const endMinutes = toMinutes(timeEnd);
          const hours = Math.max(1, Math.ceil((endMinutes - startMinutes) / 60));
          
          // Tạo booking object
          const booking = {
            id: `BK_${index + 1}`,
            roomId: String(roomId),
            room: roomFromData,
            roomName: item.roomName || roomFromData.room_name,
            checkInDate: bookingDate,
            checkInTime: timeStart,
            checkOutTime: timeEnd,
            startTime: `${timeStart} ${item.date || ''}`,
            endTime: `${timeEnd} ${item.date || ''}`,
            hours: hours,
            services: [],
            expertServices: item.expertServices || [],
            extraServices: item.extraServices || [],
            basePrice: item.basePrice || roomFromData.price || 0,
            totalPrice: item.totalPrice || item.basePrice || 0,
            cancelBefore: null as any,
            rescheduleBefore: null as any,
          };
          
          // Tính ngày hủy / đổi miễn phí
          if (bookingDate instanceof Date) {
            const cancelBefore = new Date(bookingDate);
            cancelBefore.setDate(cancelBefore.getDate() - 1);
            booking.cancelBefore = cancelBefore;
            
            const rescheduleBefore = new Date(bookingDate);
            rescheduleBefore.setDate(rescheduleBefore.getDate() - 1);
            booking.rescheduleBefore = rescheduleBefore;
          }
          
          bookingsList.push(booking);
          totalBasePrice += booking.basePrice;
        }
      });
      
      if (bookingsList.length > 0) {
        this.bookings = bookingsList;
        // Set booking đầu tiên làm booking chính (để tương thích với code cũ)
        this.booking = bookingsList[0];
        this.roomInfo = bookingsList[0].room;
        
        // Cập nhật header từ booking đầu tiên
        this.header = {
          title: bookingsList[0].roomName || bookingsList[0].room?.room_name || 'Đặt phòng',
          rating: bookingsList[0].room?.rating ?? 0,
          reviews: bookingsList[0].room?.reviews ?? 0,
        };
        
        // Tính tổng basePrice từ tất cả bookings
        this.basePrice = totalBasePrice;
        this.originalPrice = totalBasePrice;
        
        // Tính tổng totalPrice từ tất cả bookings (bao gồm dịch vụ)
        const totalFromBookings = bookingsList.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        this.totalPrice = totalFromBookings;
        
        // Dịch vụ sẽ được sync trong loadServices() sau khi load từ JSON
        // Điều này đảm bảo restore từ paymentState không bị ghi đè
        
        // Tính lại tổng (chưa có dịch vụ, chỉ tính basePrice)
        this.calculateTotal();
        this.cdr.detectChanges();
      }
    }, (error) => {
      console.warn('Không thể load rooms.json:', error);
    });
  }

  syncServicesFromMultipleBookings(bookings: any[]): void {
    // Gộp tất cả dịch vụ từ các bookings (chỉ những dịch vụ đã được chọn ở room-detail)
    const allExpertServices: any[] = [];
    const allExtraServices: any[] = [];
    
    bookings.forEach(booking => {
      (booking.expertServices || []).forEach((ex: any) => {
        // Chỉ thêm những dịch vụ có trong booking (đã được chọn ở room-detail)
        const existing = allExpertServices.find(e => {
          // So sánh name (chuẩn hóa: trim và so sánh không phân biệt hoa thường)
          if (ex.name && e.name) {
            return e.name.trim().toLowerCase() === ex.name.trim().toLowerCase();
          }
          // Nếu có ID, so sánh ID
          if (ex.id !== undefined && e.id !== undefined) {
            return String(e.id) === String(ex.id);
          }
          return false;
        });
        if (!existing) {
          // Lưu dịch vụ với selected: true (vì đã được chọn ở room-detail)
          allExpertServices.push({ ...ex });
        }
      });
      
      (booking.extraServices || []).forEach((ex: any) => {
        // Chỉ thêm những dịch vụ có trong booking (đã được chọn ở room-detail)
        const existing = allExtraServices.find(e => {
          // So sánh name (chuẩn hóa: trim và so sánh không phân biệt hoa thường)
          if (ex.name && e.name) {
            return e.name.trim().toLowerCase() === ex.name.trim().toLowerCase();
          }
          // Nếu có ID, so sánh ID
          if (ex.id !== undefined && e.id !== undefined) {
            return String(e.id) === String(ex.id);
          }
          return false;
        });
        if (existing) {
          // Cộng dồn quantity nếu trùng
          existing.quantity = (existing.quantity || 1) + (ex.quantity || 1);
        } else {
          // Lưu dịch vụ với selected: true (vì đã được chọn ở room-detail)
          allExtraServices.push({ ...ex, quantity: ex.quantity || 1 });
        }
      });
    });
    
    // (tức là chỉ những dịch vụ đã được chọn ở room-detail)
    // Reset tất cả về false trước
    this.expertServices.forEach(ex => {
      ex.selected = false;
    });
    this.extraServices.forEach(ext => {
      ext.selected = false;
    });
    
    // Sau đó chỉ tick những dịch vụ có trong bookings (đã được chọn ở room-detail)
    this.expertServices.forEach(ex => {
      const found = allExpertServices.find(e => {
        // So sánh name (chuẩn hóa: trim và so sánh không phân biệt hoa thường)
        if (e.name && ex.name) {
          return e.name.trim().toLowerCase() === ex.name.trim().toLowerCase();
        }
        // Nếu có ID, so sánh ID
        if (e.id !== undefined && ex.id !== undefined) {
          return String(e.id) === String(ex.id);
        }
        return false;
      });
      if (found) {
        ex.selected = true;
      }
    });
    
    this.extraServices.forEach(ext => {
      const found = allExtraServices.find(e => {
        // So sánh name (chuẩn hóa: trim và so sánh không phân biệt hoa thường)
        if (e.name && ext.name) {
          return e.name.trim().toLowerCase() === ext.name.trim().toLowerCase();
        }
        // Nếu có ID, so sánh ID
        if (e.id !== undefined && ext.id !== undefined) {
          return String(e.id) === String(ext.id);
        }
        return false;
      });
      if (found) {
        ext.selected = true;
        ext.quantity = found.quantity || ext.quantity || 1;
      }
    });
    
    this.updateSelectedServices();
    
    if (allExpertServices.length > 0 || allExtraServices.length > 0) {
      this.showPriceDetails = true;
    }
  }

  loadServices(): void {
    this.serviceData.getServices().subscribe((data: any) => {
      // Khởi tạo danh sách dịch vụ
      this.expertServices = (data.expertServices || []).map((s: any) => ({
        ...s,
        selected: false,
        quantity: s.quantity || 1
      }));
      this.extraServices = (data.extraServices || []).map((s: any) => ({
        ...s,
        selected: s.selected || false,
        quantity: s.quantity && s.quantity > 0 ? Math.min(10, Math.max(1, s.quantity)) : 1
      }));

      // Nếu có paymentState (quay lại từ Banking), chỉ restore từ paymentState (KHÔNG sync từ bookings)
      // Nếu không có paymentState (lần đầu load từ room-detail), mới sync từ bookings
      const paymentStateStr = localStorage.getItem('paymentState');
      const hasPaymentState = !!paymentStateStr;
      
      if (hasPaymentState) {
        // KHÔNG sync từ bookings để tránh ghi đè lên trạng thái user đã thay đổi
        // Chờ services load xong mới restore services
        if (this.expertServices.length > 0) {
          this.restorePaymentState();
          this.calculateTotal();
        } else {
          // Nếu services chưa load xong, đợi một chút rồi restore lại
          setTimeout(() => {
            if (this.expertServices.length > 0) {
              this.restorePaymentState();
              this.calculateTotal();
            }
          }, 100);
        }
      } else {
        // Reset Redeem Xu về trạng thái ban đầu (TẮT)
        this.usePoints = false;
        this.pointsApplied = false;
        this.pointsLocked = false;
        this.pointsDiscountValue = 0;
        
        setTimeout(() => {
          const el = document.getElementById('usePoints') as HTMLInputElement | null;
          if (el) {
            el.checked = false;
          }
        }, 0);
        
        // Sync từ bookings (lần đầu load từ room-detail)
        // Các dịch vụ đã chọn ở room-detail sẽ được tick tự động
        if (this.bookings.length > 0) {
          this.syncServicesFromMultipleBookings(this.bookings);
        } else {
          this.syncServicesFromBooking();
        }
        // Tính lại tổng sau khi sync
        if ((this.booking || this.bookings.length > 0)) {
          this.calculateTotal();
        }
      }
      
      this.cdr.detectChanges();
    });
  }

  syncServicesFromBooking(): void {
    try {
      const bookingStr = localStorage.getItem('selectedBooking');
      if (!bookingStr) return;

      const bookingInfo = JSON.parse(bookingStr);
      const selectedExperts = bookingInfo.expertServices || [];
      const selectedExtras = bookingInfo.extraServices || [];

      this.expertServices.forEach(ex => {
        ex.selected = false;
      });
      this.extraServices.forEach(ext => {
        ext.selected = false;
      });

      // So sánh name (vì services.json không có ID, chỉ có name)
      selectedExperts.forEach((selected: any) => {
        const found = this.expertServices.find(e => {
          // So sánh name (chuẩn hóa: trim và so sánh không phân biệt hoa thường)
          if (selected.name && e.name) {
            return e.name.trim().toLowerCase() === selected.name.trim().toLowerCase();
          }
          // Nếu có ID, so sánh ID
          if (selected.id !== undefined && e.id !== undefined) {
            return String(e.id) === String(selected.id);
          }
          return false;
        });
        if (found) {
          found.selected = true;
        }
      });

      // So sánh name (vì services.json không có ID, chỉ có name)
      selectedExtras.forEach((selected: any) => {
        const found = this.extraServices.find(e => {
          // So sánh name (chuẩn hóa: trim và so sánh không phân biệt hoa thường)
          if (selected.name && e.name) {
            return e.name.trim().toLowerCase() === selected.name.trim().toLowerCase();
          }
          // Nếu có ID, so sánh ID
          if (selected.id !== undefined && e.id !== undefined) {
            return String(e.id) === String(selected.id);
          }
          return false;
        });
        if (found) {
          found.selected = true;
          // Giữ nguyên quantity từ room-detail, nếu không có thì mặc định là 1
          if (selected.quantity !== undefined && selected.quantity !== null) {
            found.quantity = selected.quantity;
          } else if (selected.total && selected.price) {
            // Nếu có total và price, tính lại quantity
            found.quantity = Math.max(1, Math.floor(selected.total / selected.price));
          } else {
            found.quantity = found.quantity || 1;
          }
        }
      });

      // Cập nhật danh sách dịch vụ đã chọn
      this.updateSelectedServices();
      
      // Tự động hiển thị chi tiết giá nếu có dịch vụ được chọn
      if (selectedExperts.length > 0 || selectedExtras.length > 0) {
        this.showPriceDetails = true;
      }

      // Tính lại tổng giá sau khi đồng bộ dịch vụ
      this.calculateTotal();
      // Đảm bảo UI cập nhật
      this.cdr.detectChanges();
    } catch (error) {
      console.warn('Không thể đồng bộ dịch vụ từ booking:', error);
    }
  }

  toggleExpertService(service: any): void {
    // Toggle trạng thái selected ngay lập tức
    service.selected = !service.selected;
    
    // Mở chi tiết giá để user thấy thay đổi
    this.showPriceDetails = true;
    
    // Cập nhật danh sách đã chọn NGAY LẬP TỨC (tạo array mới với reference mới)
    this.selectedExpertServicesList = [...this.expertServices.filter(s => s.selected)];
    
    // Tính lại tổng giá NGAY LẬP TỨC (không gọi detectChanges bên trong)
    this.recalculateTotalImmediate();
    
    // Trigger change detection một lần duy nhất
    this.cdr.detectChanges();
  }

  toggleExtraService(service: any, event?: any): void {
    // Ngăn chặn event propagation nếu có
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Đảm bảo service có quantity mặc định (parse về number)
    if (!service.quantity || service.quantity < 1) {
      service.quantity = 1;
    } else {
      service.quantity = Number(service.quantity);
    }

    // Toggle trạng thái selected ngay lập tức
    service.selected = !service.selected;
    
    // Mở chi tiết giá để user thấy thay đổi
    this.showPriceDetails = true;
    
    // Cập nhật danh sách đã chọn NGAY LẬP TỨC (tạo array mới với reference mới)
    this.selectedExtraServicesList = this.extraServices
      .filter(s => s.selected)
      .map(s => ({
        ...s,
        quantity: Number(s.quantity) || 1
      }));
    
    // Tính lại tổng giá NGAY LẬP TỨC (không gọi detectChanges bên trong)
    this.recalculateTotalImmediate();
    
    // Trigger change detection một lần duy nhất
    this.cdr.detectChanges();
  }

  changeExtraQuantity(service: any, delta: number, event?: any): void {
    // Ngăn chặn event propagation để không trigger checkbox
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }

    // Đảm bảo service có quantity mặc định (parse về number để tránh string)
    if (!service.quantity || service.quantity < 1) {
      service.quantity = 1;
    } else {
      service.quantity = Number(service.quantity);
    }

    // Nếu delta = 0, đây là từ input event (ngModel đã cập nhật, chỉ cần validate)
    if (delta === 0) {
      // ngModel đã cập nhật service.quantity, chỉ cần đảm bảo trong khoảng hợp lệ
      const parsed = Number(service.quantity) || 1;
      service.quantity = Math.max(1, Math.min(10, parsed));
    } else if (delta !== 0) {
      // Cập nhật số lượng với delta (từ button click) - giống room-detail
      const currentQty = Number(service.quantity) || 1;
      if (delta < 0) {
        if (currentQty === 1) {
          // Bỏ tick checkbox và giữ quantity = 1
          service.selected = false;
          service.quantity = 1;
        } else if (currentQty > 1) {
          // Giảm quantity xuống 1
          service.quantity = currentQty - 1;
        }
      } else {
        // Tăng quantity
        service.quantity = Math.min(10, currentQty + 1);
      }
    }
    
    // Đảm bảo quantity là number (không phải string)
    service.quantity = Number(service.quantity);
    
    // Mở chi tiết giá nếu dịch vụ đang được chọn
    if (service.selected) {
      this.showPriceDetails = true;
      // Cập nhật lại danh sách để reflect số lượng mới (tạo reference mới)
      this.selectedExtraServicesList = this.extraServices
        .filter(s => s.selected)
        .map(s => ({
          ...s,
          quantity: Number(s.quantity) || 1
        }));
    } else {
      this.selectedExtraServicesList = this.extraServices
        .filter(s => s.selected)
        .map(s => ({
          ...s,
          quantity: Number(s.quantity) || 1
        }));
    }
    
    // Tính lại tổng giá NGAY LẬP TỨC (không gọi detectChanges bên trong)
    this.recalculateTotalImmediate();
    
    // Trigger change detection một lần duy nhất
    this.cdr.detectChanges();
  }

  // Track by function để tối ưu performance
  trackByServiceId(index: number, service: any): any {
    return service.name || service.id || index;
  }

  parseNumber(value: any): number {
    const parsed = Number(value);
    return isNaN(parsed) ? 1 : parsed;
  }

  toggleService(service: any): void {
    service.active = !service.active;
    this.calculateTotal();
  }

  get activeServices() {
    const expertActive = this.expertServices.filter(s => s.selected);
    const extraActive = this.extraServices.filter(s => s.selected);
    return [...expertActive, ...extraActive];
  }

  selectedExpertServicesList: any[] = [];
  selectedExtraServicesList: any[] = [];

  get selectedExpertServices() {
    return this.selectedExpertServicesList;
  }

  get selectedExtraServices() {
    return this.selectedExtraServicesList;
  }

  private updateSelectedServices(): void {
    this.selectedExpertServicesList = [...this.expertServices.filter(s => s.selected)];
    this.selectedExtraServicesList = [...this.extraServices.filter(s => s.selected)];
  }

  private recalculateTotalImmediate(): void {
    let preDiscount = 0;
    
    if (this.bookings.length > 0) {
      // Tính từ nhiều bookings: tổng basePrice từ bookings + dịch vụ từ UI (selectedExpertServicesList, selectedExtraServicesList)
      let totalBasePrice = 0;
      
      // Tính tổng basePrice từ tất cả bookings
      this.bookings.forEach(bk => {
        totalBasePrice += bk.basePrice || 0;
      });
      
      // Tính tổng dịch vụ từ UI (dịch vụ user đang chọn)
      const expertTotal = this.selectedExpertServicesList.reduce((sum: number, s: any) => {
        return sum + (s.price ?? 0);
      }, 0);
      
      const extraTotal = this.selectedExtraServicesList.reduce((sum: number, s: any) => {
        return sum + (s.price ?? 0) * (s.quantity || 1);
      }, 0);
      
      this.basePrice = totalBasePrice;
      preDiscount = totalBasePrice + expertTotal + extraTotal;
    } else {
      // Tính từ services đã chọn (cho single booking)
      const expertTotal = this.selectedExpertServicesList.reduce((sum: number, s: any) => sum + (s.price ?? 0), 0);
      const extraTotal = this.selectedExtraServicesList.reduce((sum: number, s: any) => sum + (s.price ?? 0) * (s.quantity || 1), 0);

      // Legacy: vẫn tính từ booking.services nếu có
      const legacyExtras = (this.booking?.services || [])
        .filter((s: any) => s.active)
        .reduce((sum: number, s: any) => sum + (s.price ?? 0), 0);

      const extras = expertTotal + extraTotal + legacyExtras;
      preDiscount = (this.basePrice ?? 0) + extras;
    }

    if (this.isCouponValid && this.discountValue > 0) {
      // Có voucher ➜ luôn hiển thị gạch giá gốc = tổng trước giảm
      this.originalPrice = preDiscount;
      let after = preDiscount - this.discountValue;
      if (after < 0) after = 0;
      this.totalPrice = after;
    } else {
      // Không có voucher ➜ không hiển thị giá gốc
      this.originalPrice = 0;
      this.totalPrice = preDiscount;
    }
    
    // Lưu ý: Không áp dụng Redeem Xu ở đây, sẽ được áp dụng trong calculateTotal() sau khi wrap
  }

  calculateTotal(): void {
    // Cập nhật danh sách dịch vụ đã chọn trước
    this.updateSelectedServices();
    
    // Tính lại tổng giá (không bao gồm Redeem Xu)
    this.recalculateTotalImmediate();
    
    // Áp dụng giảm giá từ Redeem Xu (nếu có) - NGAY LẬP TỨC
    if (this.usePoints && this.pointsDiscountValue > 0) {
      let after = this.totalPrice - this.pointsDiscountValue;
      if (after < 0) after = 0;
      this.totalPrice = after;
    }
    
    // Cứ 1000 VND = 1 Xu (làm tròn xuống) - không cần set trực tiếp
    
    // Trigger change detection (chỉ gọi một lần)
    this.cdr.detectChanges();
  }



  isCouponValid: boolean = false;

  onPromoCodeInput(event: any): void {
    const input = event.target;
    const value = input.value.toUpperCase();
    this.promoCode = value;
    input.value = value;
  }

  applyCoupon(): void {
  const code = (this.promoCode || '').trim().toUpperCase();

  this.discountValue = 0;
  this.discountMessage = '';
  this.isCouponValid = false;

  if (!code) {
    this.originalPrice = 0;
    this.calculateTotal();
    this.cdr.detectChanges();
    return;
  }

  // Tìm voucher
  const v = this.vouchers.find(
    (x: any) => String(x.code || '').toUpperCase() === code
  );

  if (!v) {
    this.discountMessage = 'Mã không hợp lệ';
    this.isCouponValid = false;
    this.originalPrice = 0;
    this.calculateTotal();
    this.cdr.detectChanges();
    return;
  }

  if (String(v.discountType || '').toLowerCase() === 'percent') {
    this.discountValue = (this.basePrice * (v.discountValue ?? 0)) / 100;
    if (v.maxDiscountAmount)
      this.discountValue = Math.min(this.discountValue, v.maxDiscountAmount);
    this.discountMessage = `Giảm ${v.discountValue}%`;
  } else {
    this.discountValue = v.discountValue ?? 0;
    this.discountMessage = `Giảm ${this.discountValue.toLocaleString()} VND`;
  }

  this.isCouponValid = true;

  this.calculateTotal();
  this.cdr.detectChanges(); // 🔥 cập nhật view ngay lập tức
}


  toggleAgree(e: any): void {
    this.agreedRules = !!e?.target?.checked;
    // Reset error state khi user check
    if (this.agreedRules) {
      this.showAgreeRequired = false;
    }
  }

  scrollToAgreeRules(): void {
    setTimeout(() => {
      const element = document.getElementById('agreeRulesContainer');
      if (element) {
        // Tính toán để checkbox nằm chính giữa màn hình
        const elementRect = element.getBoundingClientRect();
        const elementTop = elementRect.top + window.pageYOffset;
        const elementHeight = elementRect.height;
        const windowHeight = window.innerHeight;
        
        // Vị trí scroll để element nằm giữa màn hình
        const scrollPosition = elementTop - (windowHeight / 2) + (elementHeight / 2);

        window.scrollTo({
          top: Math.max(0, scrollPosition), // Đảm bảo không scroll âm
          behavior: 'smooth'
        });

        // Thêm một chút delay trước khi focus để animation scroll hoàn tất
        setTimeout(() => {
          const checkbox = document.getElementById('agreeRules') as HTMLInputElement;
          if (checkbox) {
            checkbox.focus();
            // Thêm một highlight flash effect
            element.classList.add('flash-highlight');
            setTimeout(() => {
              element.classList.remove('flash-highlight');
            }, 2000);
          }
        }, 500);
      }
    }, 100);
  }

  // ===== Đăng nhập / Đăng ký Popup =====
  async openLoginPopup(event: any): Promise<void> {
    if (!event.target.checked) return;

    const loginHTML = `
     <div class="container-fluid px-3" style="max-width: 380px; margin: auto;">
  <h3 class="text-center fw-bold text-primary mb-2">
    <i class="bi bi-person-circle me-2"></i>Đăng nhập
  </h3>
  <p class="text-center text-muted small mb-3">
    Đăng nhập để lưu thông tin của bạn
  </p>

  <input id="login-email"
         class="form-control mb-3"
         placeholder="Email hoặc SĐT">

  <div class="position-relative mb-2">
    <input id="login-password" type="password"
           class="form-control pe-5"
           placeholder="Mật khẩu">
    <i id="toggle-pass"
       class="bi bi-eye-slash position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"
       style="cursor: pointer;"></i>
  </div>

  <div class="text-end mb-3">
    <a href="#" id="forgot" class="small text-decoration-none text-primary">Quên mật khẩu?</a>
  </div>

  <hr class="my-3">

  <div class="text-center small">
    Chưa có tài khoản?
    <a href="#" id="register-link" class="fw-semibold text-warning text-decoration-none">Đăng ký ngay</a>
  </div>
</div>
    `;
    const popup = await Swal.fire({
      html: loginHTML,
      showConfirmButton: true,
      confirmButtonText: '<i class="bi bi-box-arrow-in-right me-1"></i> Đăng nhập',
      showCancelButton: true,
      cancelButtonText: 'Hủy',
      background: '#fff',
      width: '380px',
      color: '#333',
      customClass: { popup: 'shadow-lg rounded-4 border border-light' },
      didOpen: () => {
        const passInput = document.getElementById('login-password') as HTMLInputElement;
        const toggle = document.getElementById('toggle-pass') as HTMLElement;
        toggle.addEventListener('click', () => {
          const hidden = passInput.type === 'password';
          passInput.type = hidden ? 'text' : 'password';
          toggle.className = hidden ? 'bi bi-eye' : 'bi bi-eye-slash';
        });
        document.getElementById('register-link')?.addEventListener('click', (e) => {
          e.preventDefault();
          Swal.close();
          this.openRegisterPopup(event);
        });
        document.getElementById('forgot')?.addEventListener('click', (e) => {
          e.preventDefault();
          Swal.fire({
            icon: 'info',
            title: 'Tính năng đang phát triển',
            text: 'Chức năng quên mật khẩu sẽ sớm được bổ sung!',
          });
        });
      },
      preConfirm: () => {
        const email = (document.getElementById('login-email') as HTMLInputElement).value.trim();
        const password = (document.getElementById('login-password') as HTMLInputElement).value.trim();
        if (!email || !password) {
          Swal.showValidationMessage('Vui lòng nhập đầy đủ thông tin!');
          return;
        }
        return { email, password };
      },
    });

    if (popup.value) {
      const { email, password } = popup.value;
      this.authService.login(email, password).subscribe({
        next: (response: any) => {
          if (response && response.user) {
            const uid = localStorage.getItem('UID');
            const usersStr = localStorage.getItem('USERS');
            
            let userData: any = null;
            
            if (uid && usersStr) {
              try {
                const users = JSON.parse(usersStr);
                const user = users.find((u: any) => u.user_id === uid);
                
                if (user) {
                  userData = user;
                }
              } catch (e) {
                console.warn('Không thể parse users từ localStorage:', e);
              }
            }
            
            // Nếu không tìm thấy từ USERS, thử lấy từ CURRENT_USER
            if (!userData) {
              const currentUserStr = localStorage.getItem('CURRENT_USER');
              if (currentUserStr) {
                try {
                  userData = JSON.parse(currentUserStr);
                } catch (e) {
                  console.warn('Không thể parse CURRENT_USER:', e);
                }
              }
            }
            
            // Fallback: sử dụng response.user
            if (!userData && response.user) {
              userData = response.user;
            }
            
            // Cập nhật currentUser và isLoggedIn
            if (userData) {
              this.currentUser = {
                id: userData.user_id || userData.id,
                user_id: userData.user_id || userData.id,
                full_name: userData.full_name || '',
                email: userData.email || '',
                phone_number: userData.phone_number || userData.phone || '',
                phone: userData.phone_number || userData.phone || '',
                point: userData.coin || userData.point || 0,
                coin: userData.coin || userData.point || 0,
                star: userData.star || 0
              };
              
              this.isLoggedIn = true;
              
              // Điền form với dữ liệu từ users.json
              this.contactForm.patchValue({
                fullName: userData.full_name || '',
                email: userData.email || '',
                phone: userData.phone_number || userData.phone || '',
              });
              
              this.isSelfBooking = true;
              
              this.updateContactValidators();
              
              // Cập nhật userPoints từ coin
              this.userPoints = userData.coin || userData.point || 0;
              
              Swal.fire({
                icon: 'success',
                title: 'Đăng nhập thành công!',
                text: `Xin chào ${userData.full_name || 'bạn'}`,
                timer: 1800,
                showConfirmButton: false,
              });
              
              this.cdr.detectChanges();
            }
          }
        },
        error: (error: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Đăng nhập thất bại!',
            text: error.message || 'Email/SĐT hoặc mật khẩu không đúng.',
          });
          event.target.checked = false;
        },
      });
    } else {
      event.target.checked = false;
    }
  }

  async openRegisterPopup(event: any): Promise<void> {
    const registerHTML = `
    <div class="container-fluid px-3" style="max-width: 380px; margin: auto;">
  <h3 class="text-center fw-bold text-primary mb-2" style="color:#132FBA;">
    <i class="bi bi-person-plus-fill me-2"></i>Đăng ký
  </h3>

  <p class="text-center text-muted small mb-3" style="font-size:0.9rem; color:#555;">
    Tạo tài khoản mới để lưu thông tin của bạn
  </p>

  <input id="reg-name" class="form-control mb-2" placeholder="Họ và tên">
  <input id="reg-phone" class="form-control mb-2" placeholder="Số điện thoại">
  <input id="reg-email" class="form-control mb-2" placeholder="Email">

  <div class="position-relative mb-2">
    <input id="reg-password" type="password" class="form-control pe-5" placeholder="Mật khẩu">
    <i id="toggle-pass" class="bi bi-eye-slash position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"
       style="cursor:pointer; color:#777;"></i>
  </div>

  <div class="position-relative mb-3">
    <input id="reg-confirm" type="password" class="form-control pe-5" placeholder="Xác nhận mật khẩu">
    <i id="toggle-confirm" class="bi bi-eye-slash position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"
       style="cursor:pointer; color:#777;"></i>
  </div>

  <div class="text-center small mt-2">
    Đã có tài khoản?
    <a href="#" id="login-link" class="fw-semibold text-decoration-none" style="color:#132FBA; font-weight:600;">
      Đăng nhập
    </a>
  </div>
</div>
  `;

    const popup = await Swal.fire({
      html: registerHTML,
      confirmButtonText: '<i class="bi bi-person-check-fill me-1"></i> Đăng ký',
      cancelButtonText: 'Hủy',
      showCancelButton: true,
      background: '#fff',
      width: '380px',
      color: '#333',
      didOpen: () => {
        const passInput = document.getElementById('reg-password') as HTMLInputElement;
        const confirmInput = document.getElementById('reg-confirm') as HTMLInputElement;
        const togglePass = document.getElementById('toggle-pass') as HTMLElement;
        const toggleConfirm = document.getElementById('toggle-confirm') as HTMLElement;
        togglePass.addEventListener('click', () => {
          const hidden = passInput.type === 'password';
          passInput.type = hidden ? 'text' : 'password';
          togglePass.className = hidden ? 'bi bi-eye' : 'bi bi-eye-slash';
        });
        toggleConfirm.addEventListener('click', () => {
          const hidden = confirmInput.type === 'password';
          confirmInput.type = hidden ? 'text' : 'password';
          toggleConfirm.className = hidden ? 'bi bi-eye' : 'bi bi-eye-slash';
        });
        document.getElementById('login-link')?.addEventListener('click', (e) => {
          e.preventDefault();
          Swal.close();
          this.openLoginPopup(event);
        });
      },
      preConfirm: () => {
        const name = (document.getElementById('reg-name') as HTMLInputElement).value.trim();
        const phone = (document.getElementById('reg-phone') as HTMLInputElement).value.trim();
        const email = (document.getElementById('reg-email') as HTMLInputElement).value.trim();
        const password = (document.getElementById('reg-password') as HTMLInputElement).value.trim();
        const confirm = (document.getElementById('reg-confirm') as HTMLInputElement).value.trim();
        if (!name || !phone || !email || !password || !confirm) {
          Swal.showValidationMessage('Vui lòng nhập đầy đủ thông tin!');
          return;
        }
        if (password.length < 6) {
          Swal.showValidationMessage('Mật khẩu phải có ít nhất 6 ký tự!');
          return;
        }
        if (password !== confirm) {
          Swal.showValidationMessage('Mật khẩu xác nhận không khớp!');
          return;
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
          Swal.showValidationMessage('Email không hợp lệ!');
          return;
        }
        if (!/^[0-9]{9,}$/.test(phone)) {
          Swal.showValidationMessage('Số điện thoại không hợp lệ!');
          return;
        }
        return { name, phone, email, password };
      },
    });

    if (popup.value) {
      const { name, phone, email } = popup.value;
      this.currentUser = { ten: name, email, phone };
      this.isLoggedIn = true;
      this.updateContactValidators();
      Swal.fire({
        icon: 'success',
        title: 'Đăng ký thành công!',
        text: `Chào mừng ${name}, bạn đã có thể sử dụng tài khoản.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } else {
      event.target.checked = false;
    }
  }

  private updateContactValidators(): void {
    // Cần nhập thông tin khi: (chưa đăng nhập) HOẶC (đã đăng nhập nhưng KHÔNG đặt cho chính mình)
    const needContact = !this.isLoggedIn || (this.isLoggedIn && !this.isSelfBooking);

    const fullName = this.contactForm.get('fullName');
    const phone    = this.contactForm.get('phone');
    const email    = this.contactForm.get('email');

    if (needContact) {
      fullName?.setValidators([Validators.required]);
    } else {
      fullName?.clearValidators();
    }
    
    // Kể cả khi đã đăng nhập và tick "Tôi đặt phòng cho chính mình", vẫn validate định dạng
    phone?.setValidators([
      Validators.required, 
      Validators.pattern(/^[0-9]{10}$/) // Số điện thoại phải đúng 10 chữ số
    ]);
    
    email?.setValidators([
      Validators.required, 
      Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9._-]*@gmail\.com$/) // Email phải có đuôi @gmail.com
    ]);

    fullName?.updateValueAndValidity({ emitEvent: false });
    phone?.updateValueAndValidity({ emitEvent: false });
    email?.updateValueAndValidity({ emitEvent: false });
  }

  onSelfBookingToggle(checked: boolean): void {
    this.isSelfBooking = checked;
    
    if (checked) {
      if (this.isLoggedIn) {
        // Reload dữ liệu từ users.json trước khi điền
        const uid = localStorage.getItem('UID');
        const usersStr = localStorage.getItem('USERS');
        
        let userData: any = null;
        
        if (uid && usersStr) {
          try {
            const users = JSON.parse(usersStr);
            const user = users.find((u: any) => u.user_id === uid);
            
            if (user) {
              userData = user;
            }
          } catch (e) {
            console.warn('Không thể parse users từ localStorage:', e);
          }
        }
        
        // Nếu không tìm thấy từ USERS, thử lấy từ CURRENT_USER
        if (!userData) {
          const currentUserStr = localStorage.getItem('CURRENT_USER');
          if (currentUserStr) {
            try {
              userData = JSON.parse(currentUserStr);
            } catch (e) {
              console.warn('Không thể parse CURRENT_USER:', e);
            }
          }
        }
        
        if (userData) {
          // Cập nhật currentUser với dữ liệu mới nhất
          this.currentUser = {
            id: userData.user_id || userData.id,
            user_id: userData.user_id || userData.id,
            full_name: userData.full_name || '',
            email: userData.email || '',
            phone_number: userData.phone_number || userData.phone || '',
            phone: userData.phone_number || userData.phone || '',
            point: userData.coin || userData.point || 0,
            coin: userData.coin || userData.point || 0,
            star: userData.star || 0
          };
          
          // Điền form với dữ liệu từ users.json
          this.contactForm.patchValue({
            fullName: userData.full_name || '',
            phone: userData.phone_number || userData.phone || '',
            email: userData.email || '',
          });
          
          // Cập nhật userPoints từ coin
          this.userPoints = userData.coin || userData.point || 0;
          
          this.cdr.detectChanges();
        }
      }
    } else {
      // Untick checkbox → clear form (để nhập thông tin người khác)
      this.contactForm.patchValue({
        fullName: '',
        phone: '',
        email: '',
      });
    }
    
    this.updateContactValidators();
    this.cdr.detectChanges();
  }

 confirmBooking(): void {
  // 1️⃣ Kiểm tra đã đồng ý quy định chưa
  if (!this.agreedRules) {
    this.showAgreeRequired = true;
    this.scrollToAgreeRules();
    return;
  }
  
  // Reset error state khi đã đồng ý
  this.showAgreeRequired = false;

  // 2️⃣ Nếu chưa đăng nhập → bắt buộc nhập thông tin liên hệ
  // Kiểm tra các trường có giá trị và đúng format
  if (!this.isLoggedIn) {
    const formValue = this.contactForm.value;
    const fullName = (formValue.fullName || '').trim();
    const phone = (formValue.phone || '').trim();
    const email = (formValue.email || '').trim();
    
    // Kiểm tra các trường có giá trị hay không
    if (!fullName || !phone || !email) {
      this.contactForm.markAllAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Vui lòng điền đầy đủ thông tin liên hệ!',
        text: 'Vui lòng điền đầy đủ: Họ tên, Số điện thoại và Email',
      });
      return;
    }
    
    const phonePattern = /^[0-9]{10}$/;
    if (!phonePattern.test(phone)) {
      this.contactForm.get('phone')?.markAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Số điện thoại không hợp lệ!',
        text: 'Số điện thoại phải có đúng 10 chữ số (ví dụ: 0909090909)',
      });
      return;
    }
    
    const emailPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@gmail\.com$/;
    if (!emailPattern.test(email)) {
      this.contactForm.get('email')?.markAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Email không hợp lệ!',
        text: 'Email phải có đuôi @gmail.com (ví dụ: example@gmail.com)',
      });
      return;
    }
  }

  // 3️⃣ Nếu đã đăng nhập và KHÔNG tick "Tôi đặt phòng cho chính mình" 
  // → Kiểm tra xem có nhập thông tin liên hệ chưa và đúng format
  if (this.isLoggedIn && !this.isSelfBooking) {
    const formValue = this.contactForm.value;
    const fullName = (formValue.fullName || '').trim();
    const phone = (formValue.phone || '').trim();
    const email = (formValue.email || '').trim();
    
    // Kiểm tra các trường có giá trị hay không
    if (!fullName || !phone || !email) {
      this.contactForm.markAllAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Vui lòng nhập thông tin người liên hệ!',
        text: 'Vui lòng điền đầy đủ: Họ tên, Số điện thoại và Email',
      });
      return;
    }
    
    const phonePattern = /^[0-9]{10}$/;
    if (!phonePattern.test(phone)) {
      this.contactForm.get('phone')?.markAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Số điện thoại không hợp lệ!',
        text: 'Số điện thoại phải có đúng 10 chữ số (ví dụ: 0389631907)',
      });
      return;
    }
    
    const emailPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@gmail\.com$/;
    if (!emailPattern.test(email)) {
      this.contactForm.get('email')?.markAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Email không hợp lệ!',
        text: 'Email phải có đuôi @gmail.com (ví dụ: example@gmail.com)',
      });
      return;
    }
  }
  
  // → Vẫn cần validate format email và phone (vì user có thể đã chỉnh sửa)
  if (this.isLoggedIn && this.isSelfBooking) {
    const formValue = this.contactForm.value;
    const phone = (formValue.phone || '').trim();
    const email = (formValue.email || '').trim();
    
    const phonePattern = /^[0-9]{10}$/;
    if (phone && !phonePattern.test(phone)) {
      this.contactForm.get('phone')?.markAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Số điện thoại không hợp lệ!',
        text: 'Số điện thoại phải có đúng 10 chữ số (ví dụ: 0909090909)',
      });
      return;
    }
    
    const emailPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@gmail\.com$/;
    if (email && !emailPattern.test(email)) {
      this.contactForm.get('email')?.markAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Email không hợp lệ!',
        text: 'Email phải có đuôi @gmail.com (ví dụ: example@gmail.com)',
      });
      return;
    }
  }

  // 4️⃣ Nếu qua hết các điều kiện → tạo dữ liệu booking gửi qua trang banking
  // Cập nhật danh sách dịch vụ đã chọn trước khi lưu
  this.updateSelectedServices();
  
  const payload = {
    ...this.booking,
    user: this.isLoggedIn
      ? (this.isSelfBooking ? this.currentUser : this.contactForm.value)
      : this.contactForm.value,
    services: (this.booking?.services || []).filter((s: any) => s.active),
    expertServices: this.selectedExpertServicesList,
    extraServices: this.selectedExtraServicesList,
    promoCode: this.promoCode,
    total: this.totalPrice,
    date: new Date().toISOString(),
  };

  const bankingData = {
    bookings: this.bookings.length > 0 ? this.bookings : (this.booking ? [this.booking] : []),
    customer: this.isLoggedIn
      ? (this.isSelfBooking ? this.currentUser : this.contactForm.value)
      : this.contactForm.value,
    expertServices: this.selectedExpertServicesList,
    extraServices: this.selectedExtraServicesList,
    totalPrice: this.totalPrice,
    originalPrice: this.originalPrice,
    discountValue: this.discountValue,
    rewardPoints: this.rewardPoints,
    promoCode: this.promoCode,
    usePoints: this.usePoints,
    pointsDiscountValue: this.pointsDiscountValue,
    qrCodeUrl: 'https://api.vietqr.io/image/970422-TravelokaVN-qr.webp',
  };
  
  localStorage.setItem('bankingData', JSON.stringify(bankingData));
  
  // Set flag để biết đã bấm "Tiếp tục" (để không hoàn trả Xu khi ngOnDestroy)
  localStorage.setItem('PAYMENT_PROCEEDING', 'true');
  
  this.savePaymentState();

  // 5️⃣ Tạo booking mới và lưu vào lịch sử đặt phòng với trạng thái "chờ xác nhận"
  this.createNewBooking();
  
  // Dispatch event để customer-coin refresh và hiển thị booking mới (status: "Đang xử lý")
  window.dispatchEvent(new CustomEvent('userPointsUpdated'));

  this.thanhToanService.saveBooking(payload).subscribe({
    next: () => {
      Swal.fire({
        icon: 'success',
        title: 'Đang chuyển đến trang thanh toán...',
        text: 'Vui lòng hoàn tất thanh toán để xác nhận đặt chỗ.',
        confirmButtonText: 'Tiếp tục',
        timer: 2000,
      }).then(() => {
        this.router.navigate(['/banking']);
      });
    },
    error: () => {
      // Vẫn chuyển đến banking ngay cả khi lưu thất bại (dữ liệu đã có trong localStorage)
      this.router.navigate(['/banking']);
    },
  });
}




  /**
   * Tạo booking mới và lưu vào lịch sử đặt phòng với trạng thái "chờ xác nhận"
   */
  createNewBooking(): void {
    if (!this.booking || !this.roomInfo) {
      console.warn('Không thể tạo booking: thiếu thông tin booking hoặc roomInfo');
      return;
    }

    // Lấy thông tin khách hàng
    const customerInfo = this.isLoggedIn && this.isSelfBooking
      ? this.currentUser
      : this.contactForm.value;

    const customerName = customerInfo?.fullName || customerInfo?.full_name || customerInfo?.name || '';
    const customerPhone = customerInfo?.phone || customerInfo?.phone_number || '';
    const customerEmail = customerInfo?.email || '';

    // Lấy userId nếu đã đăng nhập
    let userId: string | undefined = undefined;
    if (this.isLoggedIn) {
      const uid = localStorage.getItem('UID');
      if (uid) {
        userId = String(uid); // Đảm bảo là string
      } else if (this.currentUser?.user_id) {
        userId = String(this.currentUser.user_id); // Đảm bảo là string
      } else if (this.currentUser?.id) {
        userId = String(this.currentUser.id); // Đảm bảo là string
      }
    }
    
    console.log('Creating booking with userId:', userId, 'isLoggedIn:', this.isLoggedIn);

    // Tạo ID booking mới (BK + timestamp)
    const bookingId = `BK${Date.now()}`;

    // Lấy thông tin thời gian
    let startTime = this.booking.startTime || '';
    let endTime = this.booking.endTime || '';
    let checkInTime = this.booking.checkInTime || '';
    let checkOutTime = this.booking.checkOutTime || '';
    let checkInDate: Date | null = null;

    // Nếu có checkInDate, sử dụng nó để format startTime và endTime
    if ((this.booking as any).checkInDate) {
      checkInDate = (this.booking as any).checkInDate;
      if (checkInDate instanceof Date) {
        const dateStr = `${String(checkInDate.getDate()).padStart(2, '0')}/${String(checkInDate.getMonth() + 1).padStart(2, '0')}/${checkInDate.getFullYear()}`;
        if (checkInTime && !startTime.includes('/')) {
          startTime = `${checkInTime} ${dateStr}`;
        }
        if (checkOutTime && !endTime.includes('/')) {
          endTime = `${checkOutTime} ${dateStr}`;
        }
      }
    }

    // Nếu startTime và endTime chưa có format đầy đủ, thử parse từ checkInTime/checkOutTime
    if (!startTime && checkInTime) {
      const dateStr = checkInDate 
        ? `${String(checkInDate.getDate()).padStart(2, '0')}/${String(checkInDate.getMonth() + 1).padStart(2, '0')}/${checkInDate.getFullYear()}`
        : new Date().toLocaleDateString('vi-VN');
      startTime = `${checkInTime} ${dateStr}`;
    }
    if (!endTime && checkOutTime) {
      const dateStr = checkInDate 
        ? `${String(checkInDate.getDate()).padStart(2, '0')}/${String(checkInDate.getMonth() + 1).padStart(2, '0')}/${checkInDate.getFullYear()}`
        : new Date().toLocaleDateString('vi-VN');
      endTime = `${checkOutTime} ${dateStr}`;
    }

    // Tạo danh sách services từ expertServices và extraServices
    const services: any[] = [];
    
    // Thêm expert services
    if (this.selectedExpertServicesList && this.selectedExpertServicesList.length > 0) {
      this.selectedExpertServicesList.forEach((service: any) => {
        services.push({
          type: 'expert',
          name: service.name || service.title || '',
          price: service.price || 0,
          quantity: service.quantity || 1,
          id: service.id,
          description: service.description,
          icon: service.icon
        });
      });
    }

    // Thêm extra services
    if (this.selectedExtraServicesList && this.selectedExtraServicesList.length > 0) {
      this.selectedExtraServicesList.forEach((service: any) => {
        services.push({
          type: 'extra',
          name: service.name || service.title || '',
          price: service.price || 0,
          quantity: service.quantity || 1,
          id: service.id,
          description: service.description,
          icon: service.icon
        });
      });
    }

    // Tạo booking object
    const newBooking: any = {
      id: bookingId,
      userId: userId,
      roomId: this.booking.roomId || this.roomInfo.room_id || this.roomInfo.id,
      room: {
        room_id: this.roomInfo.room_id || this.roomInfo.id,
        room_name: this.roomInfo.room_name || this.roomInfo.name,
        price: this.roomInfo.price || this.basePrice,
        range: this.booking.range || this.roomInfo.range || ''
      },
      range: this.booking.range || this.roomInfo.range || '',
      basePrice: this.basePrice,
      services: services,
      startTime: startTime,
      endTime: endTime,
      checkInTime: checkInTime || '',
      checkOutTime: checkOutTime || '',
      checkInDate: checkInDate || (this.booking as any).checkInDate || null,
      voucherCode: this.promoCode || null,
      voucherDiscountType: this.discountValue > 0 && this.promoCode ? 'fixed' : null,
      discountValue: this.discountValue > 0 ? this.discountValue : null,
      // Thông tin về giảm Xu / đổi Xu
      usePoints: this.usePoints || false,
      pointsDiscountValue: this.pointsDiscountValue || 0,
      pointsApplied: this.pointsApplied || false,
      totalPrice: this.totalPrice,
      status: 'pending', // Trạng thái "chờ xác nhận"
      customerName: customerName,
      customerPhone: customerPhone,
      customerEmail: customerEmail,
      rewardPointsEarned: this.rewardPoints,
      createdAt: new Date().toISOString()
    };

    // Lưu vào BOOKINGS_UPDATES trong localStorage
    try {
      const existingUpdatesStr = localStorage.getItem('BOOKINGS_UPDATES');
      let existingUpdates: any[] = [];
      
      if (existingUpdatesStr) {
        try {
          existingUpdates = JSON.parse(existingUpdatesStr);
          if (!Array.isArray(existingUpdates)) {
            existingUpdates = [];
          }
        } catch (e) {
          console.warn('Không thể parse BOOKINGS_UPDATES:', e);
          existingUpdates = [];
        }
      }

      // Kiểm tra xem booking ID đã tồn tại chưa (tránh trùng lặp)
      const existingIndex = existingUpdates.findIndex((b: any) => b.id === bookingId);
      if (existingIndex === -1) {
        existingUpdates.push(newBooking);
        localStorage.setItem('BOOKINGS_UPDATES', JSON.stringify(existingUpdates));
        console.log('Đã tạo booking mới:', newBooking);
        console.log('BOOKINGS_UPDATES sau khi thêm:', existingUpdates);
      } else {
        console.warn('Booking ID đã tồn tại, cập nhật thay vì tạo mới');
        existingUpdates[existingIndex] = newBooking;
        localStorage.setItem('BOOKINGS_UPDATES', JSON.stringify(existingUpdates));
      }
    } catch (e) {
      console.error('Lỗi khi lưu booking vào localStorage:', e);
    }
  }

  togglePriceDetails(): void {
    this.showPriceDetails = !this.showPriceDetails;
  }

  navigateBack(): void {
    window.history.back();
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  getBookingHours(booking: any): number {
    if (booking?.hours) {
      return booking.hours;
    }
    const ci = booking?.checkInTime;
    const co = booking?.checkOutTime;
    if (ci && co) {
      const [ih, im] = String(ci).split(':').map((n: string) => parseInt(n, 10));
      const [oh, om] = String(co).split(':').map((n: string) => parseInt(n, 10));
      const diffMin = (oh * 60 + (om || 0)) - (ih * 60 + (im || 0));
      return Math.max(1, Math.ceil(diffMin / 60));
    }
    return 1;
  }

  isServiceInBookings(service: any, type: 'expert' | 'extra'): boolean {
    if (this.bookings.length === 0) return false;
    
    return this.bookings.some(bk => {
      if (type === 'expert') {
        return (bk.expertServices || []).some((ex: any) => 
          ex.id === service.id || ex.name === service.name
        );
      } else {
        return (bk.extraServices || []).some((ex: any) => 
          ex.id === service.id || ex.name === service.name
        );
      }
    });
  }

  getUIServiceQuantity(service: any): number {
    return service.quantity || 1;
  }

  getBookingServiceQuantity(service: any): number {
    if (this.bookings.length === 0) return 0;
    
    return this.bookings.reduce((total, bk) => {
      const found = (bk.extraServices || []).find((ex: any) => 
        ex.id === service.id || ex.name === service.name
      );
      return total + (found?.quantity || 0);
    }, 0);
  }

  get bookingSummary(): string {
    if (this.bookings.length > 0) {
      // Đếm số phòng khác nhau (theo roomId)
      const uniqueRooms = new Set(this.bookings.map(b => b.roomId));
      const rooms = uniqueRooms.size;
      
      // Tính tổng số giờ từ tất cả bookings
      let totalHours = 0;
      this.bookings.forEach(b => {
        totalHours += this.getBookingHours(b);
      });
      
      return `${rooms} phòng, ${totalHours} giờ`;
    } else {
      // Fallback: tính từ single booking
      const rooms = 1;
      const hours = this.getBookingHours(this.booking);
      return `${rooms} phòng, ${hours} giờ`;
    }
  }

  // ====================== REDEEM XU (ADDED) ======================
  
  // Bọc lại calculateTotal để luôn áp dụng giảm 20.000đ sau voucher/dịch vụ
  // Lưu ý: Logic Redeem đã được tích hợp trực tiếp vào calculateTotal() để tránh vòng lặp
  private patchRedeemRecalculation(): void {
    // Không cần wrap nữa vì đã tích hợp trực tiếp vào calculateTotal()
    // Giữ lại hàm này để tương thích với code cũ (nếu có)
  }

  // Toggle dùng 50 Xu
  async togglePoints(checked: boolean): Promise<void> {
    this.usePoints = !!checked;

    if (this.usePoints) {
      // Kiểm tra đủ 50 Xu không
      if (this.userPoints < 50) {
        const short = 50 - this.userPoints;
        // Tắt lại ngay lập tức
        this.usePoints = false;
        this.cdr.detectChanges();
        const el = document.getElementById('usePoints') as HTMLInputElement | null;
        if (el) el.checked = false;

        await Swal.fire({
          icon: 'info',
          title: 'Không đủ Xu',
          text: `Bạn chỉ có ${this.userPoints} Xu. Cần thêm ${short} Xu nữa để đổi.`,
          confirmButtonText: 'Đã hiểu',
        });
        return;
      }

      // Xác nhận trước khi đổi
      const confirmResult = await Swal.fire({
        icon: 'question',
        title: 'Xác nhận dùng 50 Xu?',
        html: `Giảm <b>20.000đ</b> cho đơn này.<br/><small class="text-muted">Lưu ý: Đổi rồi sẽ <b>không hoàn Xu</b>.</small>`,
        showCancelButton: true,
        confirmButtonText: 'Xác nhận đổi',
        cancelButtonText: 'Hủy',
      });

      if (!confirmResult.isConfirmed) {
        // Người dùng không xác nhận → tắt lại
        this.usePoints = false;
        this.cdr.detectChanges();
        const el = document.getElementById('usePoints') as HTMLInputElement | null;
        if (el) el.checked = false;
        return;
      }

      // Đủ điểm ➜ trừ 50 Xu và giảm 20.000đ NGAY LẬP TỨC (ngay sau khi xác nhận)
      if (!this.pointsApplied) {
        const newPoints = Math.max(0, this.userPoints - 50);
        this.userPoints = newPoints;
        this.pointsApplied = true;
        
        // CẬP NHẬT NGAY LẬP TỨC - KHÔNG CHỜ ĐỢI
        if (this.currentUser) {
          // Cập nhật currentUser ngay lập tức
          this.currentUser.point = newPoints;
          this.currentUser.coin = newPoints;
          
          // Cập nhật USERS list trong localStorage NGAY LẬP TỨC
          const usersStr = localStorage.getItem('USERS');
          if (usersStr) {
            try {
              const users = JSON.parse(usersStr);
              const userId = this.currentUser.id || this.currentUser.user_id;
              
              // Tìm user theo id hoặc user_id
              const userIndex = users.findIndex((u: any) => 
                String(u.id) === String(userId) || String(u.user_id) === String(userId)
              );
              
              if (userIndex !== -1) {
                users[userIndex].point = newPoints;
                users[userIndex].coin = newPoints;
                localStorage.setItem('USERS', JSON.stringify(users));
                console.log('Đã cập nhật Xu trong USERS list:', newPoints);
              }
            } catch (e) {
              console.warn('Không thể cập nhật USERS list:', e);
            }
          }
          
          // Cập nhật CURRENT_USER trong localStorage NGAY LẬP TỨC
          const currentUserToSave = {
            ...this.currentUser,
            point: newPoints,
            coin: newPoints
          };
          localStorage.setItem('CURRENT_USER', JSON.stringify(currentUserToSave));
          console.log('Đã cập nhật CURRENT_USER:', newPoints);
          
          // Lưu redeem vào lịch sử NGAY LẬP TỨC
          const uid = localStorage.getItem('UID');
          const redeemRecord = {
            id: `REDEEM_${Date.now()}`,
            userId: uid || this.currentUser?.user_id || null,
            date: new Date().toLocaleDateString('vi-VN'),
            amount: 50,
            description: 'Đổi 50 Xu để giảm 20.000đ'
          };
          
          const redeemsStr = localStorage.getItem('COIN_REDEEMS');
          let redeems: any[] = [];
          if (redeemsStr) {
            try {
              redeems = JSON.parse(redeemsStr);
            } catch (e) {
              console.warn('Không thể parse COIN_REDEEMS:', e);
            }
          }
          redeems.push(redeemRecord);
          localStorage.setItem('COIN_REDEEMS', JSON.stringify(redeems));
          
          // Dispatch custom event để user-toolbar và customer-coin refresh NGAY LẬP TỨC
          window.dispatchEvent(new CustomEvent('userPointsUpdated', { 
            detail: { points: newPoints } 
          }));
          
          // Cập nhật vào users.json (async, không chặn UI - chạy sau)
          if (this.currentUser.id) {
          this.thanhToanService.updateUserPoints(this.currentUser.id, newPoints).subscribe({
            next: (updatedUser: any) => {
              if (updatedUser) {
                this.currentUser = updatedUser;
                console.log('Đã cập nhật điểm trong users.json:', newPoints);
              }
            },
            error: (err) => {
              console.warn('Không thể cập nhật điểm:', err);
            },
          });
        }
      }
      
      // Set giá trị giảm giá NGAY LẬP TỨC
      this.pointsDiscountValue = 20000;

        // Tính lại tổng giá NGAY LẬP TỨC để áp dụng giảm giá
      this.calculateTotal();
        
        // Lưu payment state NGAY LẬP TỨC
        this.savePaymentState();
      
      // Force update UI ngay lập tức
      this.cdr.detectChanges();
      }

      // Show popup sau khi đã cập nhật tất cả (Xu, giá, UI)
      await Swal.fire({
        icon: 'success',
        title: 'Đã dùng 50 Xu để giảm 20.000đ.',
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      // Tắt Redeem ➜ hoàn lại Xu và tính lại
      if (this.pointsApplied) {
        const newPoints = this.userPoints + 50;
        this.userPoints = newPoints;
        
        if (this.currentUser) {
          // Cập nhật currentUser ngay lập tức
          this.currentUser.point = newPoints;
          this.currentUser.coin = newPoints;
          
          // Cập nhật USERS list trong localStorage NGAY LẬP TỨC
          const usersStr = localStorage.getItem('USERS');
          if (usersStr) {
            try {
              const users = JSON.parse(usersStr);
              const userId = this.currentUser.id || this.currentUser.user_id;
              
              // Tìm user theo id hoặc user_id
              const userIndex = users.findIndex((u: any) => 
                String(u.id) === String(userId) || String(u.user_id) === String(userId)
              );
              
              if (userIndex !== -1) {
                users[userIndex].point = newPoints;
                users[userIndex].coin = newPoints;
                localStorage.setItem('USERS', JSON.stringify(users));
                console.log('Đã hoàn lại Xu trong USERS list:', newPoints);
              }
            } catch (e) {
              console.warn('Không thể cập nhật USERS list:', e);
            }
          }
          
          // Cập nhật CURRENT_USER trong localStorage NGAY LẬP TỨC
          const currentUserToSave = {
            ...this.currentUser,
            point: newPoints,
            coin: newPoints
          };
          localStorage.setItem('CURRENT_USER', JSON.stringify(currentUserToSave));
          console.log('Đã hoàn lại CURRENT_USER:', newPoints);
          
          // Dispatch custom event để user-toolbar refresh
          window.dispatchEvent(new CustomEvent('userPointsUpdated', { 
            detail: { points: newPoints } 
          }));
          
          // Cập nhật vào users.json (async, không chặn UI)
          if (this.currentUser.id) {
          this.thanhToanService.updateUserPoints(this.currentUser.id, newPoints).subscribe({
            next: (updatedUser: any) => {
              if (updatedUser) {
                this.currentUser = updatedUser;
                console.log('Đã hoàn lại điểm trong users.json:', newPoints);
              }
            },
            error: (err) => {
              console.warn('Không thể cập nhật điểm:', err);
            },
          });
          }
        }
      }
      this.pointsApplied = false;
      this.pointsDiscountValue = 0;
      this.calculateTotal();
      this.cdr.detectChanges();
    }
  }

  // Số Xu hiện có cho template
  get availablePoints(): number {
    return this.userPoints;
  }

  /**
   * Hoàn trả lại 50 Xu khi rời trang payment mà chưa thanh toán
   */
  ngOnDestroy(): void {
    // Chỉ hoàn trả nếu đã dùng Xu (pointsApplied = true) nhưng chưa bấm "Tiếp tục"
    // Kiểm tra xem có flag PAYMENT_PROCEEDING không (đã bấm "Tiếp tục")
    const isProceeding = localStorage.getItem('PAYMENT_PROCEEDING') === 'true';
    
    // Nếu đã dùng Xu nhưng không phải đang chuyển đến banking (chưa bấm "Tiếp tục") → hoàn trả
    // (tức là user rời trang payment bằng cách khác, không phải bấm "Tiếp tục")
    if (this.pointsApplied && !isProceeding && this.currentUser) {
      const newPoints = this.userPoints + 50;
      this.userPoints = newPoints;
      
      // Cập nhật currentUser ngay lập tức
      this.currentUser.point = newPoints;
      this.currentUser.coin = newPoints;
      
      // Cập nhật USERS list trong localStorage NGAY LẬP TỨC
      const usersStr = localStorage.getItem('USERS');
      if (usersStr) {
        try {
          const users = JSON.parse(usersStr);
          const userId = this.currentUser.id || this.currentUser.user_id;
          
          // Tìm user theo id hoặc user_id
          const userIndex = users.findIndex((u: any) => 
            String(u.id) === String(userId) || String(u.user_id) === String(userId)
          );
          
          if (userIndex !== -1) {
            users[userIndex].point = newPoints;
            users[userIndex].coin = newPoints;
            localStorage.setItem('USERS', JSON.stringify(users));
            console.log('Đã hoàn trả 50 Xu trong USERS list (rời trang payment):', newPoints);
          }
        } catch (e) {
          console.warn('Không thể cập nhật USERS list:', e);
        }
      }
      
      // Cập nhật CURRENT_USER trong localStorage NGAY LẬP TỨC
      const currentUserToSave = {
        ...this.currentUser,
        point: newPoints,
        coin: newPoints
      };
      localStorage.setItem('CURRENT_USER', JSON.stringify(currentUserToSave));
      console.log('Đã hoàn trả 50 Xu trong CURRENT_USER (rời trang payment):', newPoints);
      
      // Dispatch custom event để header và user-toolbar refresh NGAY LẬP TỨC
      window.dispatchEvent(new CustomEvent('userPointsUpdated', { 
        detail: { points: newPoints } 
      }));
      
      // Cập nhật vào users.json (async, không chặn UI)
      if (this.currentUser.id) {
        this.thanhToanService.updateUserPoints(this.currentUser.id, newPoints).subscribe({
          next: (updatedUser: any) => {
            if (updatedUser) {
              this.currentUser = updatedUser;
              console.log('Đã hoàn trả 50 Xu trong users.json (rời trang payment):', newPoints);
            }
          },
          error: (err) => {
            console.warn('Không thể cập nhật điểm:', err);
          },
        });
      }
    }
  }
}
