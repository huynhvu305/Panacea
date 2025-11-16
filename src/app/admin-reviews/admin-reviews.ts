import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';

interface Review {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  roomId: number;
  rating: number;
  content: string;
  images?: string[];
  createdAt: string;
  date?: string;
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-reviews.html',
  styleUrls: ['./admin-reviews.css']
})
export class AdminReviews implements OnInit {
  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  searchTerm: string = '';
  selectedReview: Review | null = null;
  showModal: boolean = false;
  ratingFilter: number | null = null;

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
      title: 'Admin - Quản Lý Đánh Giá - Panacea',
      description: 'Trang quản trị đánh giá - Quản lý đánh giá và phản hồi từ khách hàng Panacea',
      robots: 'noindex, nofollow'
    });
    this.loadReviews();
  }

  loadReviews(): void {
    // Load from localStorage first
    try {
      const reviewsStr = localStorage.getItem('REVIEWS') || '[]';
      const localReviews = JSON.parse(reviewsStr);
      
      // Load from JSON file
      fetch('assets/data/reviews.json')
        .then(res => res.json())
        .then((jsonReviews: Review[]) => {
          // Merge reviews, prioritizing localStorage
          const allReviews = [...jsonReviews];
          localReviews.forEach((localReview: Review) => {
            const index = allReviews.findIndex(r => r.id === localReview.id);
            if (index !== -1) {
              allReviews[index] = localReview;
            } else {
              allReviews.push(localReview);
            }
          });
          
          this.reviews = allReviews;
          this.filteredReviews = allReviews;
        })
        .catch(err => {
          console.error('Error loading reviews from JSON:', err);
          this.reviews = localReviews;
          this.filteredReviews = localReviews;
        });
    } catch (e) {
      console.error('Error loading reviews:', e);
      fetch('assets/data/reviews.json')
        .then(res => res.json())
        .then((reviews: Review[]) => {
          this.reviews = reviews;
          this.filteredReviews = reviews;
        })
        .catch(err => console.error('Error loading reviews from JSON:', err));
    }
  }

  onSearch(): void {
    this.filterReviews();
  }

  filterByRating(rating: number | null): void {
    this.ratingFilter = rating;
    this.filterReviews();
  }

  filterReviews(): void {
    let filtered = [...this.reviews];

    // Filter by rating
    if (this.ratingFilter !== null) {
      filtered = filtered.filter(r => r.rating === this.ratingFilter);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.userName.toLowerCase().includes(term) ||
        r.content.toLowerCase().includes(term) ||
        r.bookingId.toLowerCase().includes(term)
      );
    }

    this.filteredReviews = filtered;
  }

  viewReview(review: Review): void {
    this.selectedReview = review;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedReview = null;
  }

  deleteReview(review: Review): void {
    if (confirm(`Bạn có chắc chắn muốn xóa đánh giá này?`)) {
      this.reviews = this.reviews.filter(r => r.id !== review.id);
      this.filteredReviews = this.filteredReviews.filter(r => r.id !== review.id);
      localStorage.setItem('REVIEWS', JSON.stringify(this.reviews));
      this.filterReviews();
    }
  }

  getStars(rating: number): number[] {
    return Array.from({ length: rating }, (_, i) => i + 1);
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
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
