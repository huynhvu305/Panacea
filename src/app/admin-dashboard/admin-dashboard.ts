import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit, AfterViewInit, OnDestroy {
  stats = {
    totalUsers: 0,
    totalBookings: 0,
    totalRooms: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    completedBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalReviews: 0,
    averageRating: 0
  };

  revenueChart: Chart | null = null;
  statusChart: Chart | null = null;
  topRoomsChart: Chart | null = null;

  recentBookings: any[] = [];
  topUsers: any[] = [];
  topRooms: any[] = [];

  revenueByMonth: { month: string; revenue: number }[] = [];
  bookingsByStatus: { status: string; count: number }[] = [];
  currentDate: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private seoService: SEOService
  ) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }
    this.seoService.updateSEO({
      title: 'Admin Dashboard - Panacea',
      description: 'Trang quản trị tổng quan - Quản lý hệ thống Panacea',
      robots: 'noindex, nofollow'
    });
    this.currentDate = new Date().toISOString();
    this.loadStats();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
    if (this.statusChart) {
      this.statusChart.destroy();
    }
    if (this.topRoomsChart) {
      this.topRoomsChart.destroy();
    }
  }

  loadStats(): void {
    Promise.all([
      this.loadUsers(),
      this.loadBookings(),
      this.loadRooms(),
      this.loadReviews()
    ]).then(() => {
      this.processData();
    });
  }

  loadUsers(): Promise<void> {
    return new Promise((resolve) => {
      try {
        fetch('/assets/data/users.json')
          .then(res => res.json())
          .then(users => {
            this.stats.totalUsers = users.length;
            this.topUsers = users
              .filter((u: any) => u.role === 'user')
              .sort((a: any, b: any) => (b.coin || 0) - (a.coin || 0))
              .slice(0, 5);
            resolve();
          })
          .catch(() => {
            const usersStr = localStorage.getItem('USERS') || '[]';
            const users = JSON.parse(usersStr);
            this.stats.totalUsers = users.length;
            resolve();
          });
      } catch (e) {
        resolve();
      }
    });
  }

  loadBookings(): Promise<void> {
    return new Promise((resolve) => {
      fetch('/assets/data/bookings.json')
        .then(res => res.json())
        .then(bookings => {
          this.stats.totalBookings = bookings.length;
          this.stats.pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
          this.stats.completedBookings = bookings.filter((b: any) => b.status === 'completed').length;
          this.stats.confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed').length;
          this.stats.cancelledBookings = bookings.filter((b: any) => b.status === 'cancelled' || b.status === 'no-show').length;
          
          this.stats.totalRevenue = bookings.reduce((sum: number, b: any) => {
            if (b.status === 'completed' || b.status === 'confirmed') {
              return sum + (b.totalPrice || 0);
            }
            return sum;
          }, 0);

          this.recentBookings = bookings
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

          this.processRevenueByMonth(bookings);
          this.processBookingsByStatus(bookings);
          this.processTopRooms(bookings);
          resolve();
        })
        .catch(() => resolve());
    });
  }

  loadRooms(): Promise<void> {
    return new Promise((resolve) => {
      fetch('/assets/data/rooms.json')
        .then(res => res.json())
        .then(rooms => {
          this.stats.totalRooms = rooms.length;
          resolve();
        })
        .catch(() => resolve());
    });
  }

  loadReviews(): Promise<void> {
    return new Promise((resolve) => {
      fetch('/assets/data/reviews.json')
        .then(res => res.json())
        .then(reviews => {
          this.stats.totalReviews = reviews.length;
          if (reviews.length > 0) {
            const sum = reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
            this.stats.averageRating = sum / reviews.length;
          }
          resolve();
        })
        .catch(() => resolve());
    });
  }

  processRevenueByMonth(bookings: any[]): void {
    const revenueMap = new Map<string, number>();
    bookings.forEach((b: any) => {
      if (b.status === 'completed' || b.status === 'confirmed') {
        const date = new Date(b.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
        revenueMap.set(monthKey, (revenueMap.get(monthKey) || 0) + (b.totalPrice || 0));
      }
    });
    
    this.revenueByMonth = Array.from(revenueMap.entries())
      .map(([key, revenue]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          month: date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
          revenue
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }

  processBookingsByStatus(bookings: any[]): void {
    const statusMap = new Map<string, number>();
    bookings.forEach((b: any) => {
      const status = b.status || 'unknown';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    this.bookingsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status: this.getStatusLabel(status),
      count
    }));
  }

  processTopRooms(bookings: any[]): void {
    const roomMap = new Map<number, { name: string; count: number; revenue: number }>();
    bookings.forEach((b: any) => {
      if (b.room && b.room.room_id) {
        const roomId = b.room.room_id;
        const existing = roomMap.get(roomId) || { name: b.room.room_name || `Room ${roomId}`, count: 0, revenue: 0 };
        existing.count++;
        if (b.status === 'completed' || b.status === 'confirmed') {
          existing.revenue += (b.totalPrice || 0);
        }
        roomMap.set(roomId, existing);
      }
    });
    
    this.topRooms = Array.from(roomMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  processData(): void {
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  initCharts(): void {
    this.initRevenueChart();
    this.initStatusChart();
    this.initTopRoomsChart();
  }

  initRevenueChart(): void {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.revenueByMonth.map(r => r.month),
        datasets: [{
          label: 'Doanh thu (VND)',
          data: this.revenueByMonth.map(r => r.revenue),
          borderColor: '#f7941d',
          backgroundColor: 'rgba(247, 148, 29, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#f7941d',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context: any) => {
                return `Doanh thu: ${this.formatCurrency(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: any) => {
                return (value / 1000000).toFixed(1) + 'M';
              },
              color: '#64748b',
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: {
              color: '#64748b',
              font: { size: 11 }
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  initStatusChart(): void {
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.statusChart) {
      this.statusChart.destroy();
    }

    const colors = {
      'Hoàn thành': '#10b981',
      'Đã xác nhận': '#3b82f6',
      'Chờ xác nhận': '#f59e0b',
      'Đã hủy': '#ef4444',
      'Không đến': '#6b7280'
    };

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.bookingsByStatus.map(s => s.status),
        datasets: [{
          data: this.bookingsByStatus.map(s => s.count),
          backgroundColor: this.bookingsByStatus.map(s => colors[s.status as keyof typeof colors] || '#94a3b8'),
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 12 },
              color: '#64748b'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              label: (context: any) => {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  initTopRoomsChart(): void {
    const canvas = document.getElementById('topRoomsChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.topRoomsChart) {
      this.topRoomsChart.destroy();
    }

    this.topRoomsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.topRooms.map(r => r.name),
        datasets: [{
          label: 'Số lượt đặt',
          data: this.topRooms.map(r => r.count),
          backgroundColor: 'rgba(19, 47, 186, 0.8)',
          borderColor: '#132fba',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              label: (context: any) => {
                return `Số lượt đặt: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: '#64748b',
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: {
              color: '#64748b',
              font: { size: 11 },
              maxRotation: 45,
              minRotation: 45
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'completed': 'Hoàn thành',
      'confirmed': 'Đã xác nhận',
      'pending': 'Chờ xác nhận',
      'cancelled': 'Đã hủy',
      'no-show': 'Không đến'
    };
    return labels[status] || status;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

