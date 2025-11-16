import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ReviewService } from '../services/review';
import { UserService } from '../services/user';
import { AuthService } from '../services/auth';
import { SEOService } from '../services/seo.service';
import { ReviewListItem } from '../interfaces/review';
import { Booking as BookingInterface } from '../interfaces/booking';

export interface BookingDisplay {
  id: string;
  bookingId: string;
  hotelName: string;
  roomName: string;
  dateFrom: string;
  dateTo: string;
  startTime: string;
  endTime: string;
  thumbnail: string;
  bookingRef: string;
  roomId: number;
  status: string;
}

@Component({
  selector: 'app-review-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './review-room.html',
  styleUrls: ['./review-room.css'],
})
export class ReviewRoom implements OnInit, OnDestroy {
  reviewForm!: FormGroup;
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  recentReviews: ReviewListItem[] = [];
  displayedReviewsCount: number = 3;
  isLoading = false;
  isSubmitting = false;
  hoverRating: number = 0;
  showReviewModal = false;
  selectedReview: ReviewListItem | null = null;
  editReviewForm!: FormGroup;
  isEditing = false;
  isDeleting = false;
  currentEditRating: number = 0;
  originalRating: number = 0;
  bookings: BookingDisplay[] = [];
  allBookings: BookingInterface[] = [];
  allReviews: any[] = [];
  roomsMap: Map<number, any> = new Map();
  selectedBooking: BookingDisplay | null = null;
  isLoadingBookings = false;
  currentUserId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private userService: UserService,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private seoService: SEOService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.seoService.updateSEO({
      title: 'Đánh Giá Dịch Vụ - Panacea',
      description: 'Chia sẻ đánh giá và trải nghiệm của bạn về dịch vụ Panacea. Giúp chúng tôi cải thiện và phục vụ bạn tốt hơn.',
      keywords: 'Đánh giá Panacea, review Panacea, phản hồi khách hàng, trải nghiệm Panacea',
      image: '/assets/images/BACKGROUND.webp'
    });
    
    this.getCurrentUserId();
    
    this.loadRooms().then(() => {
      this.loadBookings().then(() => {
        this.loadReviews();
      });
    });
    
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['bookingId']) {
        this.reviewForm.patchValue({ bookingId: params['bookingId'] });
        const booking = this.bookings.find(b => b.bookingId === params['bookingId']);
        if (booking) {
          this.selectBooking(booking);
        }
      }
    });

    this.loadDraft();
    
    this.authService.getCurrentAccount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          if (account) {
            this.getCurrentUserId();
            this.loadBookings().then(() => {
              this.loadReviews();
            });
          } else {
            this.currentUserId = null;
            this.bookings = [];
            this.recentReviews = [];
          }
        },
        error: () => {
          this.currentUserId = null;
          this.bookings = [];
          this.recentReviews = [];
        }
      });
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

  private async loadRooms(): Promise<void> {
    try {
      const response = await fetch('assets/data/rooms.json');
      const rooms = await response.json();
      rooms.forEach((room: any) => {
        this.roomsMap.set(room.room_id, room);
      });
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  }

  private async loadBookings(): Promise<void> {
    this.isLoadingBookings = true;
    try {
      const response = await fetch('assets/data/bookings.json');
      let bookings = await response.json();
      
      const updatesStr = localStorage.getItem('BOOKINGS_UPDATES');
      if (updatesStr) {
        try {
          const updates = JSON.parse(updatesStr);
          bookings = [...bookings, ...updates];
        } catch (e) {
          console.warn('Không thể parse BOOKINGS_UPDATES:', e);
        }
      }
      
      this.allBookings = bookings;
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      this.isLoadingBookings = false;
    }
  }

  private loadReviews(): void {
    this.isLoading = true;
    this.reviewService.getReviews()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reviews) => {
          let allReviewsFromJSON = reviews || [];
          
          try {
            const localReviews = localStorage.getItem('REVIEWS');
            if (localReviews) {
              const parsedLocalReviews = JSON.parse(localReviews);
              
              const reviewMap = new Map();
              
              allReviewsFromJSON.forEach((r: any) => {
                if (r.id) reviewMap.set(r.id, r);
              });
              
              parsedLocalReviews.forEach((r: any) => {
                if (r.id) reviewMap.set(r.id, r);
              });
              
              this.allReviews = Array.from(reviewMap.values());
            } else {
              this.allReviews = allReviewsFromJSON;
            }
          } catch (e) {
            console.warn('Could not load reviews from localStorage:', e);
            this.allReviews = allReviewsFromJSON;
          }
          
          const userReviews = this.allReviews
            .filter((r: any) => r.userId === this.currentUserId)
            .sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || a.date || 0).getTime();
              const dateB = new Date(b.createdAt || b.date || 0).getTime();
              return dateB - dateA;
            })
            .map((r: any) => ({
              id: r.id,
              userId: r.userId,
              userName: r.userName || r.user,
              userAvatar: r.userAvatar,
              rating: r.rating,
              content: r.content || r.comment,
              images: r.images || [],
              createdAt: new Date(r.createdAt || r.date)
            } as ReviewListItem));
          
          this.recentReviews = userReviews;
          this.displayedReviewsCount = 3;
          this.isLoading = false;
          
          if (this.selectedReview) {
            const updatedReview = this.recentReviews.find(r => r.id === this.selectedReview?.id);
            if (updatedReview) {
              this.selectedReview = updatedReview;
              if (this.isEditing && this.editReviewForm) {
                this.editReviewForm.patchValue({
                  rating: updatedReview.rating,
                  content: updatedReview.content,
                  images: updatedReview.images || []
                });
              }
            }
          }
          
          this.filterBookingsForReview();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error loading reviews:', error);
          this.filterBookingsForReview();
        },
      });
  }

  private filterBookingsForReview(): void {
    if (!this.currentUserId) {
      this.bookings = [];
      return;
    }

    const reviewedBookingIds = new Set(
      this.allReviews
        .filter((r: any) => r.userId === this.currentUserId && r.bookingId)
        .map((r: any) => r.bookingId)
    );

    const availableBookings = this.allBookings.filter((booking: BookingInterface) => {
      const isReviewed = reviewedBookingIds.has(booking.id);
      
      return (
        booking.userId === this.currentUserId &&
        booking.status === 'completed' &&
        !isReviewed
      );
    });

    this.bookings = availableBookings.map((booking: BookingInterface) => {
      const room = this.roomsMap.get(typeof booking.roomId === 'string' 
        ? parseInt(booking.roomId.replace('R', '')) 
        : booking.roomId) || booking.room;
      
      const parseDate = (dateStr: string): Date => {
        const [time, date] = dateStr.split(' ');
        const [day, month, year] = date.split('/');
        const [hour, minute] = time.split(':');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      };

      const dateFrom = parseDate(booking.startTime);
      const dateTo = parseDate(booking.endTime);

      const zoneName = room?.tags?.[0] || 'Vườn An Nhiên';
      const roomName = room?.room_name || booking.range;

      return {
        id: booking.id,
        bookingId: booking.id,
        hotelName: zoneName,
        roomName: roomName,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        startTime: booking.startTime,
        endTime: booking.endTime,
        thumbnail: room?.image || '/assets/default-room.webp',
        bookingRef: booking.id,
        roomId: typeof booking.roomId === 'string' 
          ? parseInt(booking.roomId.replace('R', '')) 
          : booking.roomId,
        status: booking.status
      } as BookingDisplay;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, this.ratingValidator]],
      content: ['', [Validators.required, Validators.minLength(20)]],
      images: [[]],
      isPublic: [true],
      bookingId: [''],
      bookingRef: [''],
    });
  }

  ratingValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === 0) {
      return { required: true };
    }
    if (value < 1 || value > 5) {
      return { invalidRange: true };
    }
    return null;
  }

  get rating() {
    return this.reviewForm.get('rating');
  }

  get content() {
    return this.reviewForm.get('content');
  }

  setRating(value: number): void {
    this.reviewForm.patchValue({ rating: value });
    this.reviewForm.get('rating')?.markAsTouched();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  handleFiles(files: File[]): void {
    const maxFiles = 3;
    const maxSize = 2 * 1024 * 1024;

    if (this.selectedFiles.length + files.length > maxFiles) {
      Swal.fire({
        title: 'Lỗi',
        text: `Bạn chỉ có thể đính kèm tối đa ${maxFiles} ảnh.`,
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    for (const file of files) {
      if (this.selectedFiles.length >= maxFiles) {
        break;
      }

      if (!file.type.startsWith('image/')) {
        Swal.fire({
          title: 'Lỗi',
          text: `File "${file.name}" không phải là ảnh.`,
          icon: 'error',
          confirmButtonText: 'OK',
        });
        continue;
      }

      if (file.size > maxSize) {
        Swal.fire({
          title: 'Lỗi',
          text: `Ảnh "${file.name}" vượt quá 2MB. Vui lòng chọn ảnh nhỏ hơn.`,
          icon: 'error',
          confirmButtonText: 'OK',
        });
        continue;
      }

      this.selectedFiles.push(file);
      this.createPreview(file);
    }

    this.reviewForm.patchValue({ images: this.selectedFiles });
  }

  createPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        this.imagePreviews.push(e.target.result as string);
      }
    };
    reader.onerror = () => {
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể đọc file ảnh. Vui lòng thử lại.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    };
    reader.readAsDataURL(file);
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
    this.reviewForm.patchValue({ images: this.selectedFiles });
  }

  formatFiles(): FormData {
    const formData = new FormData();
    let UID = '';
    try {
      UID = localStorage.getItem('UID') || '';
    } catch (e) {
      console.warn('Could not read UID from localStorage:', e);
    }

    formData.append('userId', UID);
    formData.append('rating', this.reviewForm.get('rating')?.value.toString());
    formData.append('content', this.reviewForm.get('content')?.value);
      formData.append('isPublic', this.reviewForm.get('isPublic')?.value.toString());

    const bookingId = this.reviewForm.get('bookingId')?.value;
    if (bookingId) {
      formData.append('bookingId', bookingId);
    }

    this.selectedFiles.forEach((file, index) => {
      formData.append(`images`, file);
    });

    return formData;
  }

  submitReview(): void {
    if (!this.currentUserId) {
      Swal.fire({
        title: 'Chưa đăng nhập',
        text: 'Vui lòng đăng nhập để gửi đánh giá.',
        icon: 'warning',
        confirmButtonText: 'Đăng nhập',
        showCancelButton: true,
        cancelButtonText: 'Hủy',
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
      return;
    }

    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      
      if (this.rating?.hasError('required')) {
        Swal.fire({
          title: 'Lỗi',
          text: 'Vui lòng chọn số sao đánh giá.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else if (this.content?.hasError('minlength')) {
        Swal.fire({
          title: 'Lỗi',
          text: 'Nội dung đánh giá phải có ít nhất 20 ký tự.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
      return;
    }

    const bookingId = this.reviewForm.get('bookingId')?.value;
    if (!bookingId) {
      Swal.fire({
        title: 'Lỗi',
        text: 'Vui lòng chọn phòng đã đặt để đánh giá.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    const existingReview = this.allReviews.find((r: any) => r.bookingId === bookingId && r.userId === this.currentUserId);
    if (existingReview) {
      Swal.fire({
        title: 'Đánh giá đã tồn tại',
        text: 'Bạn đã đánh giá cho đặt phòng này rồi.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    this.isSubmitting = true;

    let userName = 'Ẩn danh';
    this.authService.getCurrentAccount().subscribe(account => {
      if (account) {
        userName = account.ho_ten;
      }
    });

    const newReview = {
      id: `RV${Date.now()}`,
      bookingId: bookingId,
      userId: this.currentUserId,
      roomId: this.selectedBooking?.roomId || 0,
      user: userName,
      userName: userName,
      rating: this.reviewForm.get('rating')?.value,
      comment: this.reviewForm.get('content')?.value,
      content: this.reviewForm.get('content')?.value,
      images: this.imagePreviews,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    this.saveReviewToLocal(newReview).then(() => {
      this.isSubmitting = false;
      
      this.userService.addPoints(50).subscribe({
        next: () => {
          window.dispatchEvent(new CustomEvent('userPointsUpdated'));
          
          this.clearDraft();

          Swal.fire({
            title: 'Thành công!',
            html: 'Đánh giá của bạn đã được gửi thành công.<br><strong>Bạn đã nhận được 50 Xu!</strong>',
            icon: 'success',
            confirmButtonText: 'OK',
          }).then(() => {
            this.loadReviews();
            this.filterBookingsForReview();
            
            this.reviewForm.reset();
            this.reviewForm.patchValue({ rating: 0, isPublic: true });
            this.selectedFiles = [];
            this.imagePreviews = [];
            this.selectedBooking = null;
          });
        },
        error: (err) => {
          console.error('Error adding points:', err);
          Swal.fire({
            title: 'Thành công!',
            text: 'Đánh giá của bạn đã được gửi thành công.',
            icon: 'success',
            confirmButtonText: 'OK',
          }).then(() => {
            this.loadReviews();
            this.filterBookingsForReview();
            this.reviewForm.reset();
            this.reviewForm.patchValue({ rating: 0, isPublic: true });
            this.selectedFiles = [];
            this.imagePreviews = [];
            this.selectedBooking = null;
          });
        }
      });
    }).catch((error) => {
      this.isSubmitting = false;
      Swal.fire({
        title: 'Lỗi',
        text: 'Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    });
  }

  private async saveReviewToLocal(review: any): Promise<void> {
    try {
      const response = await fetch('assets/data/reviews.json');
      const reviews = await response.json();
      
      reviews.push(review);
      
      localStorage.setItem('REVIEWS', JSON.stringify(reviews));
      
      this.allReviews = reviews;
    } catch (error) {
      console.error('Error saving review:', error);
      throw error;
    }
  }

  saveDraft(): void {
    try {
      const draft = {
        rating: this.reviewForm.get('rating')?.value,
        content: this.reviewForm.get('content')?.value,
        isPublic: this.reviewForm.get('isPublic')?.value,
        bookingId: this.reviewForm.get('bookingId')?.value,
      };
      localStorage.setItem('reviewDraft', JSON.stringify(draft));
    } catch (e) {
      console.warn('Could not save draft to localStorage:', e);
    }
  }

  loadDraft(): void {
    try {
      const draftStr = localStorage.getItem('reviewDraft');
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        this.reviewForm.patchValue(draft);
      }
    } catch (e) {
      console.warn('Could not load draft from localStorage:', e);
    }
  }

  clearDraft(): void {
    try {
      localStorage.removeItem('reviewDraft');
    } catch (e) {
      console.warn('Could not clear draft from localStorage:', e);
    }
  }

  openImage(imageUrl: string): void {
    window.open(imageUrl, '_blank');
  }

  openReviewModal(review: ReviewListItem): void {
    this.selectedReview = review;
    this.isEditing = false;
    this.showReviewModal = true;
    
    const fullReview = this.allReviews.find((r: any) => r.id === review.id);
    if (fullReview) {
      this.editReviewForm = this.fb.group({
        rating: [review.rating, [Validators.required, this.ratingValidator]],
        content: [review.content, [Validators.required, Validators.minLength(20)]],
        images: [review.images || []]
      });
      this.currentEditRating = review.rating;
    }
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedReview = null;
    this.isEditing = false;
  }

  enableEdit(): void {
    this.isEditing = true;
    if (this.selectedReview) {
      this.originalRating = this.selectedReview.rating;
    }
    if (this.editReviewForm) {
      this.currentEditRating = this.editReviewForm.get('rating')?.value || 0;
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    if (this.selectedReview) {
      this.editReviewForm.patchValue({
        rating: this.originalRating,
        content: this.selectedReview.content,
        images: this.selectedReview.images || []
      });
      this.currentEditRating = this.originalRating;
    }
  }

  saveEditReview(): void {
    if (!this.selectedReview || !this.editReviewForm.valid) {
      this.editReviewForm.markAllAsTouched();
      return;
    }

    const reviewIndex = this.allReviews.findIndex((r: any) => r.id === this.selectedReview?.id);
    if (reviewIndex !== -1) {
      const newRating = this.editReviewForm.get('rating')?.value;
      const newContent = this.editReviewForm.get('content')?.value;
      const newImages = this.editReviewForm.get('images')?.value || [];
      
      const updatedReview = {
        ...this.allReviews[reviewIndex],
        rating: newRating,
        content: newContent,
        comment: newContent,
        images: newImages
      };

      this.allReviews[reviewIndex] = updatedReview;
      
      localStorage.setItem('REVIEWS', JSON.stringify(this.allReviews));
      
      if (this.selectedReview) {
        this.selectedReview.rating = newRating;
        this.selectedReview.content = newContent;
        this.selectedReview.images = newImages;
      }
      
      this.loadReviews();
      
      Swal.fire({
        title: 'Thành công!',
        text: 'Đánh giá đã được cập nhật.',
        icon: 'success',
        confirmButtonText: 'OK',
      });
      
      this.isEditing = false;
    }
  }

  deleteReview(): void {
    if (!this.selectedReview) return;

    Swal.fire({
      title: 'Xác nhận xóa',
      html: 'Bạn có chắc chắn muốn xóa đánh giá này?<br><small class="text-danger">Bạn sẽ bị trừ 50 Xu khi xóa đánh giá.</small>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isDeleting = true;
        
        const reviewIndex = this.allReviews.findIndex((r: any) => r.id === this.selectedReview?.id);
        if (reviewIndex !== -1) {
          this.allReviews.splice(reviewIndex, 1);
          
          localStorage.setItem('REVIEWS', JSON.stringify(this.allReviews));
          
          const deletedReview = {
            reviewId: this.selectedReview?.id || '',
            userId: this.currentUserId,
            deletedAt: new Date().toISOString()
          };
          
          const deletedReviewsStr = localStorage.getItem('DELETED_REVIEWS');
          let deletedReviews: any[] = [];
          if (deletedReviewsStr) {
            try {
              deletedReviews = JSON.parse(deletedReviewsStr);
            } catch (e) {
              console.warn('Không thể parse DELETED_REVIEWS:', e);
            }
          }
          deletedReviews.push(deletedReview);
          localStorage.setItem('DELETED_REVIEWS', JSON.stringify(deletedReviews));
          
          this.userService.addPoints(-50).subscribe({
            next: () => {
              window.dispatchEvent(new CustomEvent('userPointsUpdated'));
              
              this.loadReviews();
              this.filterBookingsForReview();
              
              Swal.fire({
                title: 'Đã xóa!',
                html: 'Đánh giá đã được xóa thành công.<br><strong>Bạn đã bị trừ 50 Xu.</strong>',
                icon: 'success',
                confirmButtonText: 'OK',
              });
              
              this.closeReviewModal();
              this.isDeleting = false;
            },
            error: (err) => {
              console.error('Error subtracting points:', err);
              this.loadReviews();
              this.filterBookingsForReview();
              
              Swal.fire({
                title: 'Đã xóa!',
                text: 'Đánh giá đã được xóa thành công.',
                icon: 'success',
                confirmButtonText: 'OK',
              });
              
              this.closeReviewModal();
              this.isDeleting = false;
            }
          });
        } else {
          this.isDeleting = false;
        }
      }
    });
  }

  setEditRating(value: number): void {
    this.editReviewForm.patchValue({ rating: value });
    this.editReviewForm.get('rating')?.markAsTouched();
    this.currentEditRating = value;
  }

  get editRating() {
    return this.editReviewForm?.get('rating');
  }

  get editContent() {
    return this.editReviewForm?.get('content');
  }

  onEditContentChange(): void {
    if (this.selectedReview && this.editReviewForm) {
      const newContent = this.editReviewForm.get('content')?.value;
      if (newContent !== undefined) {
        this.selectedReview.content = newContent;
      }
    }
  }


  selectBooking(booking: BookingDisplay): void {
    this.selectedBooking = booking;
    this.reviewForm.patchValue({ 
      bookingId: booking.bookingId,
      bookingRef: booking.bookingRef 
    });
  }

  isBookingSelected(booking: BookingDisplay): boolean {
    return this.selectedBooking?.bookingId === booking.bookingId;
  }

  trackByBookingId(index: number, booking: BookingDisplay): string {
    return booking.bookingId;
  }

  clearSelected(): void {
    this.selectedBooking = null;
    this.reviewForm.patchValue({ bookingId: '', bookingRef: '' });
  }

  scrollToReview(): void {
    const formElement = document.getElementById('review-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const ratingButton = formElement.querySelector('.rating-star') as HTMLElement;
        if (ratingButton) {
          ratingButton.focus();
        }
      }, 500);
    }
  }

  get displayedReviews(): ReviewListItem[] {
    return this.recentReviews.slice(0, this.displayedReviewsCount);
  }

  get hasMoreReviews(): boolean {
    return this.recentReviews.length > this.displayedReviewsCount;
  }

  getCurrentDate(): Date {
    return new Date();
  }

  loadMoreReviews(): void {
    this.displayedReviewsCount += 3;
  }
}