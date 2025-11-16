import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Room } from '../interfaces/room';
import { AuthService } from '../services/auth';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-rooms',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-rooms.html',
  styleUrls: ['./admin-rooms.css']
})
export class AdminRooms implements OnInit {
  rooms: Room[] = [];
  filteredRooms: Room[] = [];
  searchTerm: string = '';
  selectedRoom: Room | null = null;
  showModal: boolean = false;
  showEditModal: boolean = false;
  editRoom: Room | null = null;

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
      title: 'Admin - Quản Lý Phòng - Panacea',
      description: 'Trang quản trị phòng - Quản lý thông tin phòng và dịch vụ Panacea',
      robots: 'noindex, nofollow'
    });
    this.loadRooms();
  }

  loadRooms(): void {
    fetch('assets/data/rooms.json')
      .then(res => res.json())
      .then((rooms: Room[]) => {
        this.rooms = rooms;
        this.filteredRooms = rooms;
      })
      .catch(err => console.error('Error loading rooms:', err));
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredRooms = this.rooms;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredRooms = this.rooms.filter(room =>
      room.room_name.toLowerCase().includes(term) ||
      room.description.toLowerCase().includes(term) ||
      room.range.toLowerCase().includes(term) ||
      room.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }

  viewRoom(room: Room): void {
    this.selectedRoom = room;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedRoom = null;
  }

  editRoomDetails(room: Room): void {
    this.editRoom = { ...room };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editRoom = null;
  }

  saveRoomChanges(): void {
    if (!this.editRoom) return;

    const index = this.rooms.findIndex(r => r.room_id === this.editRoom!.room_id);
    if (index !== -1) {
      this.rooms[index] = { ...this.editRoom };
      this.filteredRooms = [...this.rooms];
      this.onSearch();
      this.closeEditModal();
    }
  }

  deleteRoom(room: Room): void {
    if (confirm(`Bạn có chắc chắn muốn xóa phòng ${room.room_name}?`)) {
      this.rooms = this.rooms.filter(r => r.room_id !== room.room_id);
      this.filteredRooms = this.filteredRooms.filter(r => r.room_id !== room.room_id);
      this.onSearch();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  getAvailableClass(available: boolean | undefined): string {
    return available ? 'available' : 'unavailable';
  }

  getAvailableLabel(available: boolean | undefined): string {
    return available ? 'Còn trống' : 'Hết phòng';
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

