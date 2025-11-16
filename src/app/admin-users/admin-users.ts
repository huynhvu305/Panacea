import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User } from '../interfaces/user';
import { AuthService } from '../services/auth';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css']
})
export class AdminUsers implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  selectedUser: User | null = null;
  showModal: boolean = false;
  showEditModal: boolean = false;
  editUser: User | null = null;

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
      title: 'Admin - Quản Lý Người Dùng - Panacea',
      description: 'Trang quản trị người dùng - Quản lý tài khoản người dùng Panacea',
      robots: 'noindex, nofollow'
    });
    this.loadUsers();
  }

  loadUsers(): void {
    try {
      const usersStr = localStorage.getItem('USERS') || '[]';
      const users = JSON.parse(usersStr);
      this.users = users;
      this.filteredUsers = users;
    } catch (e) {
      console.error('Error loading users:', e);
      // Fallback: load from JSON file
      fetch('/assets/data/users.json')
        .then(res => res.json())
        .then(users => {
          this.users = users;
          this.filteredUsers = users;
        })
        .catch(err => console.error('Error loading users from JSON:', err));
    }
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = this.users;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.full_name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.phone_number.includes(term) ||
      user.user_id.toLowerCase().includes(term)
    );
  }

  viewUser(user: User): void {
    this.selectedUser = user;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedUser = null;
  }

  editUserDetails(user: User): void {
    this.editUser = { ...user };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editUser = null;
  }

  saveUserChanges(): void {
    if (!this.editUser) return;

    const index = this.users.findIndex(u => u.user_id === this.editUser!.user_id);
    if (index !== -1) {
      this.users[index] = { ...this.editUser };
      localStorage.setItem('USERS', JSON.stringify(this.users));
      this.filteredUsers = [...this.users];
      this.onSearch();
      this.closeEditModal();
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Bạn có chắc chắn muốn xóa user ${user.full_name}?`)) {
      this.users = this.users.filter(u => u.user_id !== user.user_id);
      this.filteredUsers = this.filteredUsers.filter(u => u.user_id !== user.user_id);
      localStorage.setItem('USERS', JSON.stringify(this.users));
      this.onSearch();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'deleted': return 'status-deleted';
      default: return 'status-active';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Tạm khóa';
      case 'deleted': return 'Đã xóa';
      default: return 'Hoạt động';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
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

