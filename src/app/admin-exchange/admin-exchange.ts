import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';
import { Voucher } from '../interfaces/voucher';
import { Items } from '../interfaces/items';

type ExchangeTab = 'voucher' | 'item';

@Component({
  selector: 'app-admin-exchange',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-exchange.html',
  styleUrls: ['./admin-exchange.css']
})
export class AdminExchange implements OnInit {
  vouchers: Voucher[] = [];
  items: Items[] = [];
  filteredVouchers: Voucher[] = [];
  filteredItems: Items[] = [];
  activeTab: ExchangeTab = 'voucher';
  searchTerm: string = '';

  // Pagination
  currentVoucherPage: number = 0;
  currentItemPage: number = 0;
  itemsPerPage: number = 4;
  totalVoucherPages: number = 0;
  totalItemPages: number = 0;

  selectedVoucher: Voucher | null = null;
  selectedItem: Items | null = null;
  showVoucherModal: boolean = false;
  showItemModal: boolean = false;
  showEditVoucherModal: boolean = false;
  showEditItemModal: boolean = false;
  editVoucher: Voucher | null = null;
  editItem: Items | null = null;

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
      title: 'Admin - Quản Lý Đổi Quà - Panacea',
      description: 'Trang quản trị đổi quà - Quản lý voucher và vật phẩm đổi thưởng Panacea',
      robots: 'noindex, nofollow'
    });
    this.loadData();
  }

  loadData(): void {
    // Load vouchers
    fetch('assets/data/voucher.json')
      .then(res => res.json())
      .then((data: Voucher[]) => {
        this.vouchers = data.map((v, index) => ({ 
          ...v, 
          status: v.status || 'Còn hiệu lực' 
        }));
        this.filterVouchers();
      })
      .catch(err => console.error('Error loading vouchers:', err));

    // Load items
    fetch('assets/data/items.json')
      .then(res => res.json())
      .then((data: Items[]) => {
        this.items = data;
        this.filterItems();
      })
      .catch(err => console.error('Error loading items:', err));
  }

  filterVouchers(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredVouchers = this.vouchers.filter(voucher =>
      voucher.code.toLowerCase().includes(term) ||
      voucher.type.toLowerCase().includes(term) ||
      (voucher.description && voucher.description.toLowerCase().includes(term))
    );
    this.totalVoucherPages = Math.ceil(this.filteredVouchers.length / this.itemsPerPage);
    if (this.currentVoucherPage >= this.totalVoucherPages) {
      this.currentVoucherPage = Math.max(0, this.totalVoucherPages - 1);
    }
  }

  filterItems(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems = this.items.filter(item =>
      item.id.toLowerCase().includes(term) ||
      item.name.toLowerCase().includes(term)
    );
    this.totalItemPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
    if (this.currentItemPage >= this.totalItemPages) {
      this.currentItemPage = Math.max(0, this.totalItemPages - 1);
    }
  }

  onSearch(): void {
    if (this.activeTab === 'voucher') {
      this.filterVouchers();
    } else {
      this.filterItems();
    }
  }

  setTab(tab: ExchangeTab): void {
    this.activeTab = tab;
    this.searchTerm = '';
    if (tab === 'voucher') {
      this.filterVouchers();
    } else {
      this.filterItems();
    }
  }

  // Pagination methods
  get paginatedVouchers(): Voucher[] {
    const start = this.currentVoucherPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredVouchers.slice(start, end);
  }

  get paginatedItems(): Items[] {
    const start = this.currentItemPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredItems.slice(start, end);
  }

  goToVoucherPage(page: number): void {
    if (page >= 0 && page < this.totalVoucherPages) {
      this.currentVoucherPage = page;
    }
  }

  goToItemPage(page: number): void {
    if (page >= 0 && page < this.totalItemPages) {
      this.currentItemPage = page;
    }
  }

  getVoucherPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 0; i < this.totalVoucherPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getItemPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 0; i < this.totalItemPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  viewVoucher(voucher: Voucher): void {
    this.selectedVoucher = voucher;
    this.showVoucherModal = true;
  }

  closeVoucherModal(): void {
    this.showVoucherModal = false;
    this.selectedVoucher = null;
  }

  viewItem(item: Items): void {
    this.selectedItem = item;
    this.showItemModal = true;
  }

  closeItemModal(): void {
    this.showItemModal = false;
    this.selectedItem = null;
  }

  editVoucherDetails(voucher: Voucher): void {
    this.editVoucher = { ...voucher };
    this.showEditVoucherModal = true;
  }

  closeEditVoucherModal(): void {
    this.showEditVoucherModal = false;
    this.editVoucher = null;
  }

  editItemDetails(item: Items): void {
    this.editItem = { ...item };
    this.showEditItemModal = true;
  }

  closeEditItemModal(): void {
    this.showEditItemModal = false;
    this.editItem = null;
  }

  saveVoucherChanges(): void {
    if (!this.editVoucher) return;

    const index = this.vouchers.findIndex(v => v.code === this.editVoucher!.code);
    if (index !== -1) {
      this.vouchers[index] = { ...this.editVoucher };
    }
    // In a real app, you would save this back to the JSON file or a backend
    console.log('Saved vouchers:', this.vouchers);
    this.filterVouchers();
    this.closeEditVoucherModal();
    Swal.fire({
      title: 'Đã cập nhật!',
      text: 'Voucher đã được cập nhật thành công.',
      icon: 'success',
      confirmButtonColor: '#132fba'
    });
  }

  saveItemChanges(): void {
    if (!this.editItem) return;

    const index = this.items.findIndex(i => i.id === this.editItem!.id);
    if (index !== -1) {
      this.items[index] = { ...this.editItem };
    }
    // In a real app, you would save this back to the JSON file or a backend
    console.log('Saved items:', this.items);
    this.filterItems();
    this.closeEditItemModal();
    Swal.fire({
      title: 'Đã cập nhật!',
      text: 'Item đã được cập nhật thành công.',
      icon: 'success',
      confirmButtonColor: '#132fba'
    });
  }

  deleteVoucher(voucher: Voucher): void {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa voucher "${voucher.code}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#132fba',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.vouchers = this.vouchers.filter(v => v.code !== voucher.code);
        // In a real app, you would save this back to the JSON file or a backend
        console.log('Deleted vouchers:', this.vouchers);
        this.filterVouchers();
        Swal.fire({
          title: 'Đã xóa!',
          text: 'Voucher đã được xóa thành công.',
          icon: 'success',
          confirmButtonColor: '#132fba'
        });
      }
    });
  }

  deleteItem(item: Items): void {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa item "${item.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#132fba',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.items = this.items.filter(i => i.id !== item.id);
        // In a real app, you would save this back to the JSON file or a backend
        console.log('Deleted items:', this.items);
        this.filterItems();
        Swal.fire({
          title: 'Đã xóa!',
          text: 'Item đã được xóa thành công.',
          icon: 'success',
          confirmButtonColor: '#132fba'
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

