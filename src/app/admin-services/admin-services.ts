import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';

interface ServiceItem {
  name: string;
  price: number;
  description: string;
  selected?: boolean;
  quantity?: number;
}

interface ServicesData {
  expertServices: ServiceItem[];
  extraServices: ServiceItem[];
}

type ServiceTab = 'expert' | 'extra';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-services.html',
  styleUrls: ['./admin-services.css']
})
export class AdminServices implements OnInit {
  servicesData: ServicesData = { expertServices: [], extraServices: [] };
  expertServices: ServiceItem[] = [];
  extraServices: ServiceItem[] = [];
  filteredExpertServices: ServiceItem[] = [];
  filteredExtraServices: ServiceItem[] = [];
  activeTab: ServiceTab = 'expert';
  searchTerm: string = '';
  selectedService: ServiceItem | null = null;
  showModal: boolean = false;
  showEditModal: boolean = false;
  editService: ServiceItem | null = null;

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
      title: 'Admin - Quản Lý Dịch Vụ - Panacea',
      description: 'Trang quản trị dịch vụ - Quản lý dịch vụ chuyên gia và dịch vụ thuê thêm Panacea',
      robots: 'noindex, nofollow'
    });
    this.loadServices();
  }

  loadServices(): void {
    fetch('assets/data/services.json')
      .then(res => res.json())
      .then((data: ServicesData) => {
        this.servicesData = data;
        this.expertServices = data.expertServices || [];
        this.extraServices = data.extraServices || [];
        this.filteredExpertServices = [...this.expertServices];
        this.filteredExtraServices = [...this.extraServices];
      })
      .catch(err => console.error('Error loading services:', err));
  }

  setActiveTab(tab: ServiceTab): void {
    this.activeTab = tab;
    this.searchTerm = '';
    this.onSearch();
  }

  getCurrentServices(): ServiceItem[] {
    return this.activeTab === 'expert' ? this.filteredExpertServices : this.filteredExtraServices;
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase();
    
    if (this.activeTab === 'expert') {
      if (!term.trim()) {
        this.filteredExpertServices = [...this.expertServices];
      } else {
        this.filteredExpertServices = this.expertServices.filter(service =>
          service.name.toLowerCase().includes(term) ||
          service.description.toLowerCase().includes(term)
        );
      }
    } else {
      if (!term.trim()) {
        this.filteredExtraServices = [...this.extraServices];
      } else {
        this.filteredExtraServices = this.extraServices.filter(service =>
          service.name.toLowerCase().includes(term) ||
          service.description.toLowerCase().includes(term)
        );
      }
    }
  }

  viewService(service: ServiceItem): void {
    this.selectedService = service;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedService = null;
  }

  editServiceDetails(service: ServiceItem): void {
    this.editService = { ...service };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editService = null;
  }

  saveServiceChanges(): void {
    if (!this.editService) return;

    if (this.activeTab === 'expert') {
      const index = this.expertServices.findIndex(s => s.name === this.editService!.name);
      if (index !== -1) {
        this.expertServices[index] = { ...this.editService };
        this.filteredExpertServices = [...this.expertServices];
        this.onSearch();
      }
    } else {
      const index = this.extraServices.findIndex(s => s.name === this.editService!.name);
      if (index !== -1) {
        this.extraServices[index] = { ...this.editService };
        this.filteredExtraServices = [...this.extraServices];
        this.onSearch();
      }
    }
    
    this.closeEditModal();
  }

  deleteService(service: ServiceItem): void {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa dịch vụ "${service.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#132fba',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.activeTab === 'expert') {
          this.expertServices = this.expertServices.filter(s => s.name !== service.name);
          this.filteredExpertServices = this.filteredExpertServices.filter(s => s.name !== service.name);
        } else {
          this.extraServices = this.extraServices.filter(s => s.name !== service.name);
          this.filteredExtraServices = this.filteredExtraServices.filter(s => s.name !== service.name);
        }
        this.onSearch();
        Swal.fire({
          title: 'Đã xóa!',
          text: 'Dịch vụ đã được xóa thành công.',
          icon: 'success',
          confirmButtonColor: '#132fba',
          timer: 2000
        });
      }
    });
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

