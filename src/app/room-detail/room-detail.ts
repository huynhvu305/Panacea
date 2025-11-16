import { Component, OnDestroy, OnInit, LOCALE_ID } from '@angular/core';
import { Room } from '../interfaces/room';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceDataService } from '../services/service';
import { ReviewService } from '../services/review';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [NgIf, NgFor, CommonModule, RouterModule, FormsModule],
  templateUrl: './room-detail.html',
  styleUrl: './room-detail.css',
  providers: [{ provide: LOCALE_ID, useValue: 'vi-VN' }]
})
export class RoomDetail implements OnInit, OnDestroy {
  Math = Math;
  room!: Room;
  currentSlide: number = 0;
  autoSlideInterval: any;
  popupImage: string | null = null;
  isExpanded: boolean = false;
  selectedDate: string = '';
  selectedTime: string = '';
  timeSlots: string[] = [];
  availableTimeSlots: string[] = [];
  minDate: string = '';
  expertServices: any[] = [];
  extraServices: any[] = [];
  totalPrice: number = 0;
  reviews: any[] = [];
  averageRating: number = 0;
  totalReviews: number = 0;
  showAllExperts: boolean = false;
  showAllExtras: boolean = false;
  isCartOpen: boolean = false;
  cart: any[] = [];
  get cartCount(): number {
    return this.getGroupedCartItems().length;
  }
  activeSection: string = 'overview';
  private scrollHandler?: () => void;

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient,
    private router: Router,
    private serviceData: ServiceDataService,
    private reviewService: ReviewService,
    private seoService: SEOService
  ) {
    this.generateTimeSlots();
    this.setMinDate();
    this.updateAvailableTimeSlots();
  }

  slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD') // Chuyển ký tự có dấu thành không dấu
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .trim()
      .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
      .replace(/-+/g, '-'); // Loại bỏ nhiều dấu gạch ngang liên tiếp
  }

  ngOnInit(): void {
  window.scrollTo(0, 0);

  const slug = this.route.snapshot.paramMap.get('slug') || '';

  this.http.get<Room[]>('assets/data/rooms.json').subscribe((rooms) => {
    // Tìm phòng theo slug (slugify từ room_name)
    this.room = rooms.find((r) => this.slugify(r.room_name) === slug)!;
    
    if (!this.room) {
      console.warn(`Không tìm thấy phòng với slug: ${slug}`);
      this.router.navigate(['/room-list']);
      return;
    }
    
    if (this.room?.photos?.length) this.startAutoSlide();
    
    // SEO với structured data
    if (this.room) {
      const roomImage = this.room.photos && this.room.photos.length > 0 
        ? this.room.photos[0] 
        : '/assets/images/BACKGROUND.webp';
      const roomDescription = this.room.description || this.room.long_description || 
        `Đặt phòng ${this.room.room_name} tại Panacea - Không gian trị liệu và chữa lành tâm hồn.`;
      
      this.seoService.updateSEO({
        title: `${this.room.room_name} - Panacea`,
        description: roomDescription,
        keywords: `Panacea, ${this.room.room_name}, đặt phòng, spa, massage, trị liệu, ${this.room.tags?.join(', ') || ''}`,
        image: roomImage,
        type: 'product',
        structuredData: this.seoService.createProductSchema({
          name: this.room.room_name,
          description: roomDescription,
          image: roomImage,
          price: this.room.price || 0,
          currency: 'VND',
          availability: 'https://schema.org/InStock'
        })
      });
    }
    
    setTimeout(() => window.scrollTo(0, 0), 100);
    
    if (this.room && slug !== this.slugify(this.room.room_name)) {
      const correctSlug = this.slugify(this.room.room_name);
      this.router.navigate(['/room-detail', correctSlug], { replaceUrl: true });
    }
    
    if (this.room) {
      this.loadReviews(this.room.room_id);
    }
  });

  this.serviceData.getServices().subscribe((data) => {
    this.expertServices = data.expertServices;
    this.extraServices = data.extraServices;
  });

  window.addEventListener('keydown', this.handleKeyEvents.bind(this));

  this.loadCart();
  
  setTimeout(() => {
    this.initScrollSpy();
  }, 500);
}

  initScrollSpy(): void {
    const sections = ['overview', 'policy', 'reviews'];
    const scrollOffset = 120; // Offset để trigger sớm hơn (tính cả navbar height)
    
    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + scrollOffset;
      let currentSection = 'overview';
      let activeElement: HTMLElement | null = null;
      let activeDistance = Infinity;
      
      // Tìm section nào có top position gần nhất với scroll position
      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = window.scrollY + rect.top;
          const distance = Math.abs(scrollPosition - elementTop);
          
          // Nếu section đã vượt qua top của viewport (đang scroll trong section này)
          // hoặc section gần với scroll position nhất
          if (elementTop <= scrollPosition + 100) {
            if (distance < activeDistance) {
              activeDistance = distance;
              activeElement = element;
              currentSection = sectionId;
            }
          }
        }
      });
      
      // Fallback: Nếu ở đầu trang, luôn chọn 'overview'
      if (window.scrollY < 50) {
        currentSection = 'overview';
      }
      // Nếu không tìm thấy section nào phù hợp và đang ở giữa trang
      // Chọn section cuối cùng đã vượt qua
      else if (!activeElement && window.scrollY > 100) {
        for (let i = sections.length - 1; i >= 0; i--) {
          const element = document.getElementById(sections[i]);
          if (element) {
            const rect = element.getBoundingClientRect();
            const elementTop = window.scrollY + rect.top;
            if (elementTop <= scrollPosition) {
              currentSection = sections[i];
              break;
            }
          }
        }
      }
      
      if (this.activeSection !== currentSection) {
        this.activeSection = currentSection;
      }
    };
    
    let ticking = false;
    this.scrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    
    // Gọi lần đầu để set activeSection ban đầu
    setTimeout(() => updateActiveSection(), 300);
  }

  navigateBack(): void {
    this.router.navigate(['/room-list']);
  }

  startAutoSlide(): void {
    this.autoSlideInterval = setInterval(() => this.nextSlide(), 4000);
  }

  nextSlide(): void {
    if (!this.room?.photos?.length) return;
    this.currentSlide = (this.currentSlide + 1) % this.room.photos.length;
  }

  prevSlide(): void {
    if (!this.room?.photos?.length) return;
    this.currentSlide = (this.currentSlide - 1 + this.room.photos.length) % this.room.photos.length;
  }

  selectSlide(index: number): void {
    this.currentSlide = index;
  }

  openPopup(image: string): void {
    this.popupImage = image;
  }

  closePopup(): void {
    this.popupImage = null;
  }

  toggleDescription(): void {
  this.isExpanded = !this.isExpanded;
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      this.activeSection = sectionId;
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  // Lắng nghe phím tắt
  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.handleKeyEvents.bind(this));
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }

  // Điều hướng ảnh trong popup
  nextPopupImage(event?: Event): void {
    event?.stopPropagation();
    if (!this.room?.photos?.length) return;
    const currentIndex = this.room.photos.indexOf(this.popupImage!);
    const nextIndex = (currentIndex + 1) % this.room.photos.length;
    this.popupImage = this.room.photos[nextIndex];
  }

  prevPopupImage(event?: Event): void {
    event?.stopPropagation();
    if (!this.room?.photos?.length) return;
    const currentIndex = this.room.photos.indexOf(this.popupImage!);
    const prevIndex = (currentIndex - 1 + this.room.photos.length) % this.room.photos.length;
    this.popupImage = this.room.photos[prevIndex];
  }

  // Hỗ trợ phím tắt
  handleKeyEvents(e: KeyboardEvent) {
    if (!this.popupImage) return;
    if (e.key === 'ArrowRight') this.nextPopupImage();
    if (e.key === 'ArrowLeft') this.prevPopupImage();
    if (e.key === 'Escape') this.closePopup();
  }

selectRoom(): void {
  if (!this.selectedDate || !this.selectedTime) {
    Swal.fire({
      icon: 'warning',
      title: 'Thiếu thông tin',
      text: 'Vui lòng chọn đầy đủ ngày và giờ trước khi đặt phòng!',
      confirmButtonColor: '#132fba'
    });
    return;
  }

  if (this.isPastDate(this.selectedDate)) {
    Swal.fire({
      icon: 'error',
      title: 'Ngày không hợp lệ',
      text: 'Không thể chọn ngày trong quá khứ. Vui lòng chọn ngày từ hôm nay trở đi.',
      confirmButtonColor: '#132fba'
    });
    return;
  }

  if (this.isPastTime(this.selectedDate, this.selectedTime)) {
    Swal.fire({
      icon: 'error',
      title: 'Giờ không hợp lệ',
      text: 'Không thể chọn giờ trong quá khứ. Vui lòng chọn giờ trong tương lai.',
      confirmButtonColor: '#132fba'
    });
    return;
  }

  // Kiểm tra phải đặt trước ít nhất 30 phút
  if (!this.isAtLeast30MinutesBefore(this.selectedDate, this.selectedTime)) {
    const [startTime] = this.selectedTime.split(' - ');
    Swal.fire({
      icon: 'error',
      title: 'Chưa đặt trước 30 phút',
      text: `Bạn phải đặt phòng trước ít nhất 30 phút so với giờ check-in (${startTime.trim()}). Vui lòng chọn khung giờ khác hoặc đặt cho ngày mai.`,
      confirmButtonColor: '#132fba'
    });
    return;
  }

  // Kiểm tra trùng lịch với booking đã có (trường hợp 1: Thanh toán ngay)
  // skipCartCheck = true vì thanh toán ngay chưa có trong giỏ hàng
  this.checkBookingConflict(this.room.room_id, this.selectedDate, this.selectedTime, true).then((conflict) => {
    if (conflict.isConflict) {
      Swal.fire({
        icon: 'warning',
        title: 'Phòng đã có người đặt',
        html: `
          <div style="text-align: left;">
            <p style="margin-bottom: 12px;"><strong>Phòng "${this.room.room_name}"</strong> đã được đặt cho:</p>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Ngày:</strong> ${conflict.conflictDate}</li>
              <li><strong>Giờ:</strong> ${conflict.conflictTime}</li>
            </ul>
            <p style="margin-top: 12px; color: #666;">Vui lòng chọn ngày/giờ khác hoặc phòng khác.</p>
          </div>
        `,
        confirmButtonText: 'Đã hiểu',
        confirmButtonColor: '#132fba',
        width: '500px'
      });
      return;
    }

    // Nếu không trùng, tiếp tục thanh toán ngay
    this.proceedToPaymentNow();
  });
}

/**
 * Hàm nội bộ để chuyển đến payment (sau khi đã kiểm tra trùng lịch - trường hợp Thanh toán ngay)
 */
private proceedToPaymentNow(): void {
  const bookingInfo = {
    roomId: this.room.room_id,
    roomName: this.room.room_name,
    basePrice: this.room.price,
    totalPrice: this.room.price,
    date: this.selectedDate,
    time: this.selectedTime,
    expertServices: [],
    extraServices: [],
    photo: this.room.photos[0],
    range: this.room.range,
    timestamp: Date.now(),
  };

  localStorage.removeItem('paymentState');
  localStorage.removeItem('processedBookings');
  localStorage.removeItem('selectedBooking');
  
  localStorage.setItem('selectedBooking', JSON.stringify(bookingInfo));
  

  // Điều hướng sang trang thanh toán
  this.router.navigate(['/payment']);
}

  setMinDate(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.minDate = `${year}-${month}-${day}`;
  }

  isPastDate(dateStr: string): boolean {
    if (!dateStr) return false;
    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today;
  }

  isPastTime(dateStr: string, timeStr: string): boolean {
    if (!dateStr || !timeStr) return false;
    
    try {
      // Parse time slot (ví dụ: "09:00 - 10:00")
      const [startTime] = timeStr.split(' - ');
      const [hours, minutes] = startTime.split(':').map(Number);
      
      // Parse date
      const selectedDate = new Date(dateStr);
      selectedDate.setHours(hours, minutes, 0, 0);
      
      const now = new Date();
      now.setSeconds(0, 0);
      
      // Nếu chọn hôm nay và giờ đã qua hoặc bằng giờ hiện tại → không hợp lệ
      return selectedDate <= now;
    } catch (e) {
      return false;
    }
  }

  /**
   * Kiểm tra xem thời gian check-in có cách hiện tại ít nhất 30 phút không
   * @param dateStr Ngày check-in (format: YYYY-MM-DD)
   * @param timeStr Khung giờ check-in (format: "HH:MM - HH:MM")
   * @returns true nếu cách hiện tại ít nhất 30 phút, false nếu không
   */
  isAtLeast30MinutesBefore(dateStr: string, timeStr: string): boolean {
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

  updateAvailableTimeSlots(): void {
    if (!this.selectedDate) {
      // Nếu chưa chọn ngày, hiển thị tất cả giờ
      this.availableTimeSlots = [...this.timeSlots];
      return;
    }

    const today = new Date();
    const selectedDate = new Date(this.selectedDate);
    const isToday = selectedDate.toDateString() === today.toDateString();

    if (isToday) {
      // Nếu chọn hôm nay, chỉ hiển thị các giờ trong tương lai
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const minHour = currentHour + 1;
      
      // Nếu đã qua 22:00, không còn giờ nào có thể chọn
      if (minHour >= 22) {
        this.availableTimeSlots = [];
        return;
      }
      
      this.availableTimeSlots = this.timeSlots.filter(slot => {
        const [startTime] = slot.split(' - ');
        const [hours] = startTime.split(':').map(Number);
        return hours >= minHour;
      });
    } else {
      // Nếu chọn ngày trong tương lai, hiển thị tất cả giờ
      this.availableTimeSlots = [...this.timeSlots];
    }
  }

  formatDateToDDMMYYYY(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  onDateChange(): void {
    this.selectedTime = '';
    this.updateAvailableTimeSlots();
  }

  onTimeChange(): void {
  }

generateTimeSlots(): void {
  const startHour = 8;
  const endHour = 22;
  const slots: string[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push(`${start} - ${end}`);
  }

  this.timeSlots = slots;
  this.availableTimeSlots = [...slots];
}

updateTotal(): void {
  this.totalPrice = this.room?.price || 0;
  }

  loadReviews(roomId: number): void {
    // Load từ reviews.json trước
    this.reviewService.getReviews().subscribe((data: any[]) => {
      let allReviews = [...data];
      
      // Merge với reviews từ localStorage (nếu có)
      try {
        const localReviews = localStorage.getItem('REVIEWS');
        if (localReviews) {
          let parsedReviews: any[] = [];
          try {
            parsedReviews = JSON.parse(localReviews);
          } catch (parseError) {
            console.error('Error parsing reviews from localStorage:', parseError);
            parsedReviews = [];
          }
          // Gộp tất cả reviews, loại bỏ trùng lặp dựa trên id
          const reviewMap = new Map();
          
          // Thêm reviews từ JSON trước
          data.forEach((r: any) => {
            if (r.id) reviewMap.set(r.id, r);
          });
          
          // Thêm/update reviews từ localStorage (ưu tiên hơn)
          parsedReviews.forEach((r: any) => {
            if (r.id) reviewMap.set(r.id, r);
          });
          
          allReviews = Array.from(reviewMap.values());
        }
      } catch (e) {
        console.warn('Could not load reviews from localStorage:', e);
      }
      
      // Filter theo roomId và hiển thị tất cả
      this.reviews = allReviews.filter((r: any) => r.roomId === roomId);
      this.totalReviews = this.reviews.length;
      this.averageRating = this.calculateAverageRating();
    });
  }

  calculateAverageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return parseFloat((sum / this.reviews.length).toFixed(1));
  }

  getDisplayStars(): number {
    if (this.averageRating < 4.5) {
      return 4;
    }
    return 5;
  }

// 🧠 Toggle giỏ hàng popup
toggleCart(): void {
  this.isCartOpen = !this.isCartOpen;
}

// 🛒 Load giỏ hàng
loadCart(): void {
  try {
    this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (e) {
    console.error('Error parsing cart from localStorage:', e);
    this.cart = [];
  }
}

// ➕ Add to cart (nâng cấp bản cũ)
addToCart() {
  if (!this.selectedDate || !this.selectedTime) {
    Swal.fire({
      icon: 'warning',
      title: 'Vui lòng chọn đầy đủ thông tin!',
      text: 'Bạn cần chọn ngày và giờ trước khi thêm vào giỏ hàng.',
      confirmButtonText: 'Đã hiểu',
      confirmButtonColor: '#132fba'
    });
    return;
  }

  if (this.isPastDate(this.selectedDate)) {
    Swal.fire({
      icon: 'error',
      title: 'Ngày không hợp lệ',
      text: 'Không thể chọn ngày trong quá khứ. Vui lòng chọn ngày từ hôm nay trở đi.',
      confirmButtonColor: '#132fba'
    });
    return;
  }

  if (this.isPastTime(this.selectedDate, this.selectedTime)) {
    Swal.fire({
      icon: 'error',
      title: 'Giờ không hợp lệ',
      text: 'Không thể chọn giờ trong quá khứ. Vui lòng chọn giờ trong tương lai.',
      confirmButtonColor: '#132fba'
    });
    return;
  }

  // Kiểm tra phải đặt trước ít nhất 30 phút khi thêm vào giỏ
  if (!this.isAtLeast30MinutesBefore(this.selectedDate, this.selectedTime)) {
    const [startTime] = this.selectedTime.split(' - ');
    Swal.fire({
      icon: 'error',
      title: 'Chưa đặt trước 30 phút',
      text: `Bạn phải đặt phòng trước ít nhất 30 phút so với giờ check-in (${startTime.trim()}). Vui lòng chọn khung giờ khác hoặc đặt cho ngày mai.`,
      confirmButtonColor: '#132fba'
    });
    return;
  }

  // Kiểm tra trùng lịch với booking đã có (trường hợp 2: Thêm vào giỏ hàng)
  // skipCartCheck = false vì cần kiểm tra với items trong giỏ hàng
  this.checkBookingConflict(this.room.room_id, this.selectedDate, this.selectedTime, false).then((conflict) => {
    if (conflict.isConflict) {
      Swal.fire({
        icon: 'warning',
        title: 'Phòng đã có người đặt',
        html: `
          <div style="text-align: left;">
            <p style="margin-bottom: 12px;"><strong>Phòng "${this.room.room_name}"</strong> đã được đặt cho:</p>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Ngày:</strong> ${conflict.conflictDate}</li>
              <li><strong>Giờ:</strong> ${conflict.conflictTime}</li>
            </ul>
            <p style="margin-top: 12px; color: #666;">Vui lòng chọn ngày/giờ khác hoặc phòng khác.</p>
          </div>
        `,
        confirmButtonText: 'Đã hiểu',
        confirmButtonColor: '#132fba',
        width: '500px'
      });
      return;
    }

    // Nếu không trùng, tiếp tục thêm vào giỏ hàng
    this.addToCartInternal();
  });
}

/**
 * Hàm nội bộ để thêm vào giỏ hàng (sau khi đã kiểm tra trùng lịch)
 */
private addToCartInternal(): void {
  const basePrice = this.room.price;

  const newItem = {
    roomId: this.room.room_id,
    roomName: this.room.room_name,
    date: this.selectedDate,
    time: this.selectedTime,
    photo: this.room.photos[0],
    basePrice: basePrice,
    expertServices: [],
    extraServices: [],
    totalPrice: basePrice,
  };

  let currentCart: any[] = [];
  try {
    currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (e) {
    console.error('Error parsing cart from localStorage:', e);
    currentCart = [];
  }
  
  currentCart.push(newItem);

  localStorage.setItem('cart', JSON.stringify(currentCart));

  this.cart = currentCart;

  window.dispatchEvent(new CustomEvent('cartUpdated'));
  Swal.fire({
    icon: 'success',
    title: 'Thêm vào giỏ hàng thành công!',
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
  });
}

/**
 * Kiểm tra xem có booking nào trùng lịch với phòng, ngày, giờ đã chọn không
 * @param roomId ID phòng
 * @param date Ngày đặt (format: YYYY-MM-DD)
 * @param time Khung giờ đặt (format: "HH:mm - HH:mm")
 * @param skipCartCheck Nếu true, bỏ qua kiểm tra trong giỏ hàng (dùng cho thanh toán ngay)
 */
private async checkBookingConflict(roomId: number, date: string, time: string, skipCartCheck: boolean = false): Promise<{
  isConflict: boolean;
  conflictDate?: string;
  conflictTime?: string;
}> {
  try {
    // Load bookings từ bookings.json
    const bookingsResponse = await fetch('assets/data/bookings.json');
    const bookings: any[] = await bookingsResponse.json();

    // Load BOOKINGS_UPDATES từ localStorage
    const updatesStr = localStorage.getItem('BOOKINGS_UPDATES');
    let updates: any[] = [];
    if (updatesStr) {
      try {
        updates = JSON.parse(updatesStr);
      } catch (e) {
        console.warn('Không thể parse BOOKINGS_UPDATES:', e);
      }
    }

    // Gộp tất cả bookings
    const allBookings = [...bookings, ...updates];

    // Kiểm tra cả trong giỏ hàng hiện tại (tránh đặt trùng với chính mình)
    let cartItems: any[] = [];
    try {
      const cartStr = localStorage.getItem('cart');
      if (cartStr) {
        cartItems = JSON.parse(cartStr);
      }
    } catch (e) {
      console.warn('Không thể parse cart:', e);
    }

    // Parse ngày và giờ đã chọn
    // date format: YYYY-MM-DD
    const [year, month, day] = date.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    
    const [timeStart, timeEnd] = time.split(' - ').map(t => t.trim());
    const [startHour, startMinute] = timeStart.split(':').map(Number);
    const [endHour, endMinute] = timeEnd.split(':').map(Number);
    
    const selectedStart = new Date(selectedDateObj);
    selectedStart.setHours(startHour, startMinute, 0, 0);
    
    const selectedEnd = new Date(selectedDateObj);
    selectedEnd.setHours(endHour, endMinute, 0, 0);
    
    console.log('Kiểm tra trùng lịch - Phòng:', roomId, 'Ngày:', date, 'Giờ:', time);
    console.log('Selected time range:', selectedStart, 'to', selectedEnd);

    // Chỉ kiểm tra các booking có trạng thái "chờ xác nhận" hoặc "đã xác nhận"
    const activeStatuses = ['pending', 'confirmed'];
    
    const checkTimeOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
      // Overlap xảy ra khi: start1 < end2 VÀ end1 > start2
      return start1.getTime() < end2.getTime() && end1.getTime() > start2.getTime();
    };

    // Kiểm tra trùng với các item trong giỏ hàng (tránh đặt trùng với chính mình)
    // Chỉ kiểm tra nếu không skip (skip khi thanh toán ngay vì chưa có trong cart)
    if (!skipCartCheck) {
      for (const cartItem of cartItems) {
        if (cartItem.roomId !== roomId) continue;
        if (cartItem.date !== date) continue;
        
        // Parse thời gian từ cart item
        const [cartTimeStart, cartTimeEnd] = cartItem.time.split(' - ').map((t: string) => t.trim());
        const [cartStartHour, cartStartMinute] = cartTimeStart.split(':').map(Number);
        const [cartEndHour, cartEndMinute] = cartTimeEnd.split(':').map(Number);
        
        const cartStart = new Date(selectedDateObj);
        cartStart.setHours(cartStartHour, cartStartMinute, 0, 0);
        
        const cartEnd = new Date(selectedDateObj);
        cartEnd.setHours(cartEndHour, cartEndMinute, 0, 0);
        
        if (checkTimeOverlap(selectedStart, selectedEnd, cartStart, cartEnd)) {
          console.log('Trùng với item trong giỏ hàng:', cartItem);
          return {
            isConflict: true,
            conflictDate: date,
            conflictTime: cartItem.time
          };
        }
      }
    }
    
    // Tìm booking trùng
    for (const booking of allBookings) {
      // Kiểm tra roomId
      const bookingRoomId = typeof booking.roomId === 'string' 
        ? parseInt(booking.roomId.replace('R', '')) 
        : booking.roomId;
      
      if (bookingRoomId !== roomId) continue;
      
      // Chỉ kiểm tra status "pending" (chờ xác nhận) hoặc "confirmed" (đã xác nhận)
      // Bỏ qua cancelled, no-show, completed
      if (!activeStatuses.includes(booking.status)) {
        console.log('Bỏ qua booking:', booking.id, 'status:', booking.status);
        continue;
      }

      console.log('Kiểm tra booking:', booking.id, 'status:', booking.status, 'startTime:', booking.startTime, 'endTime:', booking.endTime);

      // Parse thời gian của booking
      let bookingStart: Date | null = null;
      let bookingEnd: Date | null = null;
      
      if (booking.startTime && booking.endTime) {
        // Format: "HH:mm DD/MM/YYYY" hoặc "HH:mm D/M/YYYY"
        // Regex linh hoạt hơn để match cả 1 chữ số và 2 chữ số
        const startMatch = booking.startTime.match(/(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        const endMatch = booking.endTime.match(/(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        
        if (startMatch && endMatch) {
          const [, sh, sm, sd, sM, sY] = startMatch.map(Number);
          const [, eh, em, ed, eM, eY] = endMatch.map(Number);
          
          bookingStart = new Date(sY, sM - 1, sd, sh, sm);
          bookingEnd = new Date(eY, eM - 1, ed, eh, em);
          
          console.log('Parsed từ startTime/endTime:', bookingStart, bookingEnd);
        } else {
          console.warn('Không match regex cho startTime/endTime:', booking.startTime, booking.endTime);
        }
      } else if (booking.checkInTime && booking.checkOutTime && (booking as any).checkInDate) {
        // Fallback: dùng checkInDate, checkInTime, checkOutTime
        let checkInDate: Date;
        if ((booking as any).checkInDate instanceof Date) {
          checkInDate = new Date((booking as any).checkInDate);
        } else if (typeof (booking as any).checkInDate === 'string') {
          // Nếu là string, parse nó
          const dateStr = (booking as any).checkInDate;
          if (dateStr.includes('T')) {
            checkInDate = new Date(dateStr);
          } else {
            // Format YYYY-MM-DD
            const [y, m, d] = dateStr.split('-').map(Number);
            checkInDate = new Date(y, m - 1, d);
          }
        } else {
          checkInDate = new Date((booking as any).checkInDate);
        }
        
        const [cih, cim] = booking.checkInTime.split(':').map(Number);
        const [coh, com] = booking.checkOutTime.split(':').map(Number);
        
        bookingStart = new Date(checkInDate);
        bookingStart.setHours(cih, cim || 0, 0, 0);
        
        bookingEnd = new Date(checkInDate);
        bookingEnd.setHours(coh, com || 0, 0, 0);
        
        console.log('Parsed từ checkInDate/checkInTime/checkOutTime:', bookingStart, bookingEnd);
      }

      if (!bookingStart || !bookingEnd) {
        console.log('Không parse được thời gian cho booking:', booking.id);
        continue;
      }

      console.log('Booking time range:', bookingStart, 'to', bookingEnd);

      // Kiểm tra trùng lịch (có overlap)
      const hasOverlap = checkTimeOverlap(selectedStart, selectedEnd, bookingStart, bookingEnd);
      
      console.log('Has overlap?', hasOverlap, 'selectedStart:', selectedStart.getTime(), 'selectedEnd:', selectedEnd.getTime(), 'bookingStart:', bookingStart.getTime(), 'bookingEnd:', bookingEnd.getTime());
      
      if (hasOverlap) {
        console.log('Tìm thấy trùng lịch với booking:', booking.id);
        // Format ngày giờ để hiển thị
        const conflictDate = bookingStart.toLocaleDateString('vi-VN');
        let conflictTime = '';
        
        if (booking.checkInTime && booking.checkOutTime) {
          conflictTime = `${booking.checkInTime} - ${booking.checkOutTime}`;
        } else if (booking.startTime && booking.endTime) {
          // Extract time từ format "HH:mm DD/MM/YYYY"
          const startTimeMatch = booking.startTime.match(/(\d{2}):(\d{2})/);
          const endTimeMatch = booking.endTime.match(/(\d{2}):(\d{2})/);
          if (startTimeMatch && endTimeMatch) {
            conflictTime = `${startTimeMatch[0]} - ${endTimeMatch[0]}`;
          } else {
            conflictTime = `${bookingStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${bookingEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
          }
        } else {
          conflictTime = `${bookingStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${bookingEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        return {
          isConflict: true,
          conflictDate,
          conflictTime
        };
      }
    }

    return { isConflict: false };
  } catch (error) {
    console.error('Lỗi khi kiểm tra trùng lịch:', error);
    // Nếu có lỗi, cho phép đặt (không block)
    return { isConflict: false };
  }
}

removeFromCart(index: number): void {
  this.cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(this.cart));
  this.loadCart();
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}
removeGroupFromCart(group: any): void {
  const itemsToRemove = (group.originalItems || [group]).map((item: any) => 
    `${item.roomId}_${item.date}_${item.time}`
  );
  const remainingCart = this.cart.filter((c: any) => {
    const key = `${c.roomId}_${c.date}_${c.time}`;
    return !itemsToRemove.includes(key);
  });
  
  localStorage.setItem('cart', JSON.stringify(remainingCart));
  this.cart = remainingCart;
  // cartCount là getter, không cần cập nhật thủ công
}

// 💰 Tính tổng tiền
getCartTotal(): number {
  return this.cart.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
}

getGroupedCartItems(): any[] {
  if (this.cart.length === 0) return [];
  
  // Gộp các items cùng phòng và giờ liên tiếp
  const merged = this.mergeConsecutiveBookings([...this.cart]);
  
  // Chuyển đổi thành format để hiển thị trong giỏ hàng
  return merged.map(item => {
    // Tính số giờ
    const [start, end] = item.time.split(' - ').map((t: string) => t.trim());
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const hours = Math.max(1, Math.ceil((toMinutes(end) - toMinutes(start)) / 60));
    
    return {
      roomId: item.roomId,
      roomName: item.roomName,
      date: item.date,
      time: item.time,
      hours: hours,
      photo: item.photo,
      basePrice: item.basePrice,
      expertServices: item.expertServices || [],
      extraServices: item.extraServices || [],
      totalPrice: item.totalPrice,
      originalItems: item.originalItems || []
    };
  });
}

private isTimeInRange(time: string, range: string): boolean {
  const [timeStart, timeEnd] = time.split(' - ').map((t: string) => t.trim());
  const [rangeStart, rangeEnd] = range.split(' - ').map((t: string) => t.trim());
  
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  
  const timeStartMin = toMinutes(timeStart);
  const timeEndMin = toMinutes(timeEnd);
  const rangeStartMin = toMinutes(rangeStart);
  const rangeEndMin = toMinutes(rangeEnd);
  
  // Kiểm tra xem time có nằm trong range không
  return timeStartMin >= rangeStartMin && timeEndMin <= rangeEndMin;
}

getCartItemIndex(item: any): number {
  return this.cart.findIndex((c: any) => 
    c.roomId === item.roomId &&
    c.date === item.date &&
    c.time === item.time
  );
}

goToPaymentForGroup(group: any): void {
  this.isCartOpen = false;
  
  // Lấy tất cả items gốc thuộc nhóm này
  const groupItems = group.originalItems || [group];
  
  if (groupItems.length === 0) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: 'Không tìm thấy items để thanh toán!',
      confirmButtonColor: '#132fba'
    });
    return;
  }
  
  // Kiểm tra từng item xem có đặt trước 30 phút không (kiểm tra lại khi thanh toán)
  const invalidItems: any[] = [];
  for (const item of groupItems) {
    if (!this.isAtLeast30MinutesBefore(item.date, item.time)) {
      invalidItems.push(item);
    }
  }
  
  if (invalidItems.length > 0) {
    const [firstInvalid] = invalidItems;
    const [startTime] = firstInvalid.time.split(' - ');
    Swal.fire({
      icon: 'error',
      title: 'Chưa đặt trước 30 phút',
      text: `Phòng "${firstInvalid.roomName}" với khung giờ ${startTime.trim()} đã không còn đủ thời gian để đặt (phải đặt trước ít nhất 30 phút so với giờ check-in). Vui lòng xóa khỏi giỏ hàng hoặc chọn phòng khác.`,
      confirmButtonColor: '#132fba'
    });
    return;
  }
  
  // Kiểm tra trùng lịch cho tất cả items trong group (trường hợp 3: Thanh toán từ giỏ hàng)
  // skipCartCheck = false vì cần kiểm tra với bookings và các items khác trong giỏ hàng
  const conflictChecks = groupItems.map((item: any) => 
    this.checkBookingConflict(item.roomId, item.date, item.time, false)
  );
  
  Promise.all(conflictChecks).then((results) => {
    const conflicts = results.filter(r => r.isConflict);
    
    if (conflicts.length > 0) {
      const firstConflict = conflicts[0];
      const conflictItem = groupItems[results.findIndex(r => r.isConflict)];
      
      Swal.fire({
        icon: 'warning',
        title: 'Phòng đã có người đặt',
        html: `
          <div style="text-align: left;">
            <p style="margin-bottom: 12px;"><strong>Phòng "${conflictItem.roomName}"</strong> đã được đặt cho:</p>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Ngày:</strong> ${firstConflict.conflictDate}</li>
              <li><strong>Giờ:</strong> ${firstConflict.conflictTime}</li>
            </ul>
            <p style="margin-top: 12px; color: #666;">Vui lòng xóa item này khỏi giỏ hàng hoặc chọn ngày/giờ khác.</p>
          </div>
        `,
        confirmButtonText: 'Đã hiểu',
        confirmButtonColor: '#132fba',
        width: '500px'
      });
      return;
    }
    
    // Nếu không trùng, tiếp tục thanh toán
    this.proceedToPaymentForGroup(groupItems);
  });
}

/**
 * Hàm nội bộ để chuyển đến payment (sau khi đã kiểm tra trùng lịch)
 */
private proceedToPaymentForGroup(groupItems: any[]): void {
  localStorage.removeItem('paymentState');
  localStorage.removeItem('selectedBooking');
  
  // Gộp các items cùng phòng và giờ liên tiếp (nếu chưa được gộp)
  const processedBookings = this.mergeConsecutiveBookings(groupItems);
  
  localStorage.setItem('processedBookings', JSON.stringify(processedBookings));
  
  
  // Xóa items đã thanh toán khỏi giỏ hàng
  const itemsToRemove = groupItems.map((item: any) => 
    `${item.roomId}_${item.date}_${item.time}`
  );
  const remainingCart = this.cart.filter((c: any) => {
    const key = `${c.roomId}_${c.date}_${c.time}`;
    return !itemsToRemove.includes(key);
  });
  
  localStorage.setItem('cart', JSON.stringify(remainingCart));
  this.cart = remainingCart;
  // cartCount là getter, không cần cập nhật thủ công
  
  // Điều hướng sang trang thanh toán
  this.router.navigate(['/payment']);
}

private areTimesConsecutive(time1: string, time2: string): boolean {
  // time format: "HH:mm - HH:mm"
  const [start1, end1] = time1.split(' - ').map((t: string) => t.trim());
  const [start2, end2] = time2.split(' - ').map((t: string) => t.trim());
  
  // Chuyển thành phút để so sánh
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const end1Minutes = toMinutes(end1);
  const start2Minutes = toMinutes(start2);
  
  // Liên tiếp nếu end1 = start2
  return end1Minutes === start2Minutes;
}

private areTimesOverlapping(time1: string, time2: string): boolean {
  const [start1, end1] = time1.split(' - ').map((t: string) => t.trim());
  const [start2, end2] = time2.split(' - ').map((t: string) => t.trim());
  
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const start1Min = toMinutes(start1);
  const end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  const end2Min = toMinutes(end2);
  
  // Trùng lặp nếu có overlap
  return !(end1Min <= start2Min || end2Min <= start1Min);
}

private mergeConsecutiveBookings(cart: any[]): any[] {
  if (cart.length === 0) return [];
  
  // Nhóm theo roomId và date
  const grouped: { [key: string]: any[] } = {};
  cart.forEach(item => {
    const key = `${item.roomId}_${item.date}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });
  
  const merged: any[] = [];
  
  // Helper function để chuyển time string thành minutes
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  // Helper function để chuyển minutes thành time string
  const toTimeString = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  // Xử lý từng nhóm (cùng phòng, cùng ngày)
  Object.values(grouped).forEach(group => {
    // Sắp xếp theo thời gian bắt đầu
    group.sort((a, b) => {
      const [startA] = a.time.split(' - ').map((t: string) => t.trim());
      const [startB] = b.time.split(' - ').map((t: string) => t.trim());
      return startA.localeCompare(startB);
    });
    
    // Tạo intervals từ các items
    const intervals: Array<{ start: number, end: number, item: any }> = group.map(item => {
      const [start, end] = item.time.split(' - ').map((t: string) => t.trim());
      return {
        start: toMinutes(start),
        end: toMinutes(end),
        item: item
      };
    });
    
    // Merge intervals (gộp các khoảng overlap hoặc liên tiếp)
    const mergedIntervals: Array<{ start: number, end: number, items: any[] }> = [];
    
    intervals.forEach(interval => {
      if (mergedIntervals.length === 0) {
        mergedIntervals.push({
          start: interval.start,
          end: interval.end,
          items: [interval.item]
        });
      } else {
        const last = mergedIntervals[mergedIntervals.length - 1];
        // Gộp nếu overlap hoặc liên tiếp (end của last >= start của interval)
        if (last.end >= interval.start) {
          // Gộp: cập nhật end thành max của cả hai
          last.end = Math.max(last.end, interval.end);
          last.items.push(interval.item);
        } else {
          // Không gộp được → tạo interval mới
          mergedIntervals.push({
            start: interval.start,
            end: interval.end,
            items: [interval.item]
          });
        }
      }
    });
    
    // Tạo booking items từ các merged intervals
    mergedIntervals.forEach(mergedInterval => {
      const items = mergedInterval.items;
      if (items.length === 0) return;
      
      // Lấy item đầu tiên làm base
      const baseItem = items[0];
      const mergedBooking: any = {
        ...baseItem,
        time: `${toTimeString(mergedInterval.start)} - ${toTimeString(mergedInterval.end)}`,
        basePrice: 0,
        totalPrice: 0,
        expertServices: [],
        extraServices: [],
        originalItems: items
      };
      
      // Gộp tất cả items trong interval
      const expertServicesMap = new Map();
      const extraServicesMap = new Map();
      
      items.forEach((item: any) => {
        // Cộng basePrice
        mergedBooking.basePrice += item.basePrice || 0;
        mergedBooking.totalPrice += item.basePrice || 0;
        
        // Gộp expert services (không cộng dồn nếu trùng)
        (item.expertServices || []).forEach((ex: any) => {
          if (!expertServicesMap.has(ex.id)) {
            expertServicesMap.set(ex.id, { ...ex });
            mergedBooking.totalPrice += ex.price || 0;
          }
        });
        
        // Gộp extra services (cộng dồn quantity nếu trùng)
        (item.extraServices || []).forEach((ex: any) => {
          const key = ex.id;
          if (extraServicesMap.has(key)) {
            const existing = extraServicesMap.get(key);
            existing.quantity = (existing.quantity || 1) + (ex.quantity || 1);
            mergedBooking.totalPrice += (ex.price || 0) * (ex.quantity || 1);
          } else {
            extraServicesMap.set(key, { ...ex, quantity: ex.quantity || 1 });
            mergedBooking.totalPrice += (ex.price || 0) * (ex.quantity || 1);
          }
        });
      });
      
      // Chuyển Map thành array
      mergedBooking.expertServices = Array.from(expertServicesMap.values());
      mergedBooking.extraServices = Array.from(extraServicesMap.values());
      
      merged.push(mergedBooking);
    });
  });
  
  return merged;
  }

goToPayment(): void {
  this.isCartOpen = false;
  
  let cart: any[] = [];
  try {
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (e) {
    console.error('Error parsing cart from localStorage:', e);
    cart = [];
  }
  
  if (cart.length === 0) {
    alert('Giỏ hàng trống!');
    return;
  }
  
  // Đảm bảo chỉ lấy dữ liệu từ cart, không bị xung đột với "Thanh toán ngay"
  localStorage.removeItem('paymentState');
  localStorage.removeItem('selectedBooking');
  
  // Gộp các bookings cùng phòng và giờ liên tiếp
  const processedBookings = this.mergeConsecutiveBookings(cart);
  
  localStorage.setItem('processedBookings', JSON.stringify(processedBookings));
  
  
  // Điều hướng sang trang thanh toán
  this.router.navigate(['/payment']);
}

goToPaymentForItem(index: number): void {
  this.isCartOpen = false;
  
  let cart: any[] = [];
  try {
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (e) {
    console.error('Error parsing cart from localStorage:', e);
    cart = [];
  }
  
  if (index < 0 || index >= cart.length) {
    alert('Item không hợp lệ!');
    return;
  }
  
  // Lấy item tại index
  const item = cart[index];
  
  // Tạo mảng chỉ chứa item này (để gộp giờ liên tiếp nếu có)
  // Tìm tất cả items cùng phòng, cùng ngày, và giờ liên tiếp với item này
  const sameRoomItems = cart.filter((c: any) => 
    c.roomId === item.roomId && c.date === item.date
  );
  
  // Đảm bảo chỉ lấy dữ liệu từ cart, không bị xung đột với "Thanh toán ngay"
  localStorage.removeItem('paymentState');
  localStorage.removeItem('selectedBooking');
  
  // Gộp các items cùng phòng và giờ liên tiếp
  const processedBookings = this.mergeConsecutiveBookings(sameRoomItems);
  
  localStorage.setItem('processedBookings', JSON.stringify(processedBookings));
  
  
  // Xóa items đã thanh toán khỏi giỏ hàng
  const remainingCart = cart.filter((c: any, i: number) => {
    // Xóa item tại index và các items cùng phòng, cùng ngày (đã được gộp)
    if (i === index) return false;
    if (c.roomId === item.roomId && c.date === item.date) {
      // Kiểm tra xem item này có trong processedBookings không (đã được gộp)
      return !processedBookings.some((pb: any) => {
        const [pbStart, pbEnd] = pb.time.split(' - ');
        const [cStart, cEnd] = c.time.split(' - ');
        // Nếu thời gian của c nằm trong khoảng thời gian của pb thì đã được gộp
        return cStart >= pbStart && cEnd <= pbEnd;
      });
    }
    return true;
  });
  
  localStorage.setItem('cart', JSON.stringify(remainingCart));
  this.cart = remainingCart;
  // cartCount là getter, không cần cập nhật thủ công
  
  // Điều hướng sang trang thanh toán
  this.router.navigate(['/payment']);
}

}
