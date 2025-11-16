import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SEOService } from '../services/seo.service';


class RoomService {
  search(data: any) {
    console.log('Tìm kiếm với:', data);
  }
}

@Component ({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './room-list.html',
  styleUrl: './room-list.css',
})

export class RoomList implements OnInit {
  constructor(
    private http: HttpClient, 
    private router: Router,
    private route: ActivatedRoute,
    private seoService: SEOService
  ) {}
  rawPackages: any[] = [];
  allPackages: any[] = [];
  originalPackages: any[] = [];

  // ===== Lọc theo giá =====
  minPrice: number = 200000;
  maxPrice: number = 1250000;
  selectedMinPrice: number = this.minPrice;
  selectedMaxPrice: number = this.maxPrice;

  // ===== Các biến tìm kiếm =====
  sortOrder: string = '';
  keywordInput = '';
  checkinDate: string = '';
  minDate: string = ''; // Ngày tối thiểu có thể chọn (hôm nay)
  guestCountFilter: string = '';
  selectedTags: string[] = [];
  selectedGardens: string[] = [];
  availableTags = ['thiền', 'tĩnh tâm', 'healing', 'trò chuyện', 'chill nhẹ', 'workshop'];
  gardenTags: string[] = ['Oasis', 'Genii', 'Mutiny', 'Catharis'];
  spaceTags: string[] = [
    "Không gian thiền/yên tĩnh",
    "Không gian cá nhân",
    "Không gian riêng tư",
    "Không gian nhóm nhỏ",
    "Không gian nhóm lớn",
    "Không gian học tập/chia sẻ",
    "Không gian thư giãn",
    "Không gian luyện tập",
    "Không gian cân bằng năng lượng",
    "Không gian kết nối",
    "Không gian phục hồi năng lượng",
    "Không gian sáng tạo",
    "Không gian nghệ thuật",
    "Không gian yên tĩnh",
    "Không gian giải trí",
    "Không gian xả stress",
    "Không gian đồng đội",
    "Không gian năng động"
  ];

selectedSpaceTags: string[] = [];

showAllSpaceTags: boolean = false;

get visibleSpaceTags(): string[] {
  return this.showAllSpaceTags ? this.spaceTags : this.spaceTags.slice(0, 5);
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

  goToRoomDetail(room: any) {
    const slug = this.slugify(room.room_name);
    this.router.navigate(['/room-detail', slug]);
  }


  ngOnInit() {
    // SEO
    this.seoService.updateSEO({
      title: 'Đặt phòng - Panacea',
      description: 'Tìm kiếm và đặt phòng tại Panacea - Không gian trị liệu và chữa lành tâm hồn với các khu vực Catharsis, Oasis, Genii, Mutiny.',
      keywords: 'đặt phòng Panacea, phòng trị liệu, phòng thiền, phòng yoga, Catharsis, Oasis, Genii, Mutiny',
      image: '/assets/images/BACKGROUND.webp'
    });

    this.setMinDate();

    window.scrollTo(0, 0);
    
    const params = this.route.snapshot.queryParams;
    
    // Xử lý garden filter (có thể là 'garden' hoặc 'gardens')
    const gardenParam = params['garden'];
    const gardensParam = params['gardens'];
    
    if (gardenParam && this.gardenTags.includes(gardenParam)) {
      if (!this.selectedGardens.includes(gardenParam)) {
        this.selectedGardens.push(gardenParam);
      }
    } else if (gardensParam) {
      // Nếu có nhiều gardens từ homepage
      const gardens = gardensParam.split(',');
      gardens.forEach((g: string) => {
        if (this.gardenTags.includes(g) && !this.selectedGardens.includes(g)) {
          this.selectedGardens.push(g);
        }
      });
    }
    
    // Xử lý guest count filter
    if (params['guests']) {
      this.guestCountFilter = params['guests'];
    }
    
    // Xử lý price filter
    if (params['minPrice']) {
      this.selectedMinPrice = parseInt(params['minPrice']) || this.minPrice;
    }
    if (params['maxPrice']) {
      this.selectedMaxPrice = parseInt(params['maxPrice']) || this.maxPrice;
    }
    
    // Xử lý sort order
    if (params['sort']) {
      this.sortOrder = params['sort'];
    }
    
    // Xử lý space tags
    if (params['spaceTags']) {
      const tags = params['spaceTags'].split(',');
      tags.forEach((tag: string) => {
        if (this.spaceTags.includes(tag) && !this.selectedSpaceTags.includes(tag)) {
          this.selectedSpaceTags.push(tag);
        }
      });
    }
    
    this.http.get<any[]>('assets/data/rooms.json').subscribe(data => {
      this.rawPackages = data;
      this.originalPackages = [...data];
      this.flattenPackages();
      // Áp dụng filter sau khi load dữ liệu
      this.onFilterRooms();
      setTimeout(() => window.scrollTo(0, 0), 100);
    });
  }

  viewMode: 'horizontal' | 'vertical' = 'vertical';

  setViewMode(mode: 'horizontal' | 'vertical') {
    this.viewMode = mode;
  }

  onFilterRooms() {
    this.performSearch();
  }

  // Hàm tìm kiếm thống nhất - kết hợp từ khóa, ngày đến và các filter khác
  performSearch(): void {
    const keyword = this.keywordInput.trim().toLowerCase();
    const selectedDate = this.checkinDate;

    // Lọc các phòng
    this.allPackages = this.originalPackages.filter(pkg => {
      // 1. Lọc theo từ khóa (nếu có)
      let matchesKeyword = true;
      if (keyword) {
        const inRoomName = pkg.room_name.toLowerCase().includes(keyword);
        const inDescription = (pkg.description || '').toLowerCase().includes(keyword);
        const inTags = pkg.tags && pkg.tags.some((tag: string) => tag.toLowerCase().includes(keyword));
        matchesKeyword = inRoomName || inDescription || inTags;
      }

      // 2. Lọc theo ngày đến (nếu có)
      let matchesDate = true;
      if (selectedDate) {
        // Có thể thêm logic kiểm tra availability theo ngày ở đây
        matchesDate = true;
      }

      // 3. Lọc theo khu vườn (Oasis, Genii, Mutiny, Catharis)
      let matchesGarden = true;
      if (this.selectedGardens.length > 0) {
        // Kiểm tra xem phòng có tag nào trong selectedGardens không
        matchesGarden = pkg.tags && pkg.tags.some((tag: string) => 
          this.selectedGardens.includes(tag)
        );
      }

      // 4. Lọc theo sức chứa
      let matchesGuestCount = true;
      if (this.guestCountFilter) {
        const guestFilter = parseInt(this.guestCountFilter);
        const [minGuest, maxGuest] = this.parseGuestRange(pkg.range);
        
        // Kiểm tra xem phòng có thể chứa số lượng khách yêu cầu không
        if (guestFilter === 2) {
          // 1-2 người: phòng có max <= 2
          matchesGuestCount = maxGuest <= 2 && minGuest >= 1;
        } else if (guestFilter === 5) {
          // 3-5 người: phòng có min >= 3 và max <= 5
          matchesGuestCount = minGuest >= 3 && maxGuest <= 5;
        } else if (guestFilter === 10) {
          // 6-10 người: phòng có min >= 6 và max <= 10
          matchesGuestCount = minGuest >= 6 && maxGuest <= 10;
        }
      }

      // 5. Lọc theo khoảng giá
      const matchesPrice = pkg.price >= this.selectedMinPrice && pkg.price <= this.selectedMaxPrice;

      // 6. Lọc theo loại hình không gian
      let matchesSpace = true;
      if (this.selectedSpaceTags.length > 0) {
        matchesSpace = pkg.tags && this.selectedSpaceTags.some((tag: string) => 
          pkg.tags.includes(tag)
        );
      }

      // 7. Lọc theo tags khác (nếu có)
      const matchesTags = this.selectedTags.length === 0 || 
        (pkg.tags && this.selectedTags.some(tag => pkg.tags.includes(tag)));

      // Tất cả điều kiện phải thỏa mãn (AND logic)
      return matchesKeyword && matchesDate && matchesGarden && 
             matchesGuestCount && matchesPrice && matchesSpace && matchesTags;
    });

    // Áp dụng sắp xếp nếu có
    if (this.sortOrder === 'asc') {
      this.allPackages.sort((a, b) => a.price - b.price);
    } else if (this.sortOrder === 'desc') {
      this.allPackages.sort((a, b) => b.price - a.price);
    }
  }

  resetPrice(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedMinPrice = this.minPrice;
    this.selectedMaxPrice = this.maxPrice;
    this.onFilterRooms();
  }

  onPriceChange() {
    // Đảm bảo min không lớn hơn max và ngược lại
    if (this.selectedMinPrice > this.selectedMaxPrice) {
      this.selectedMinPrice = this.selectedMaxPrice;
    }
    if (this.selectedMaxPrice < this.selectedMinPrice) {
      this.selectedMaxPrice = this.selectedMinPrice;
    }
    // Đảm bảo giá trị trong khoảng hợp lệ
    if (this.selectedMinPrice < this.minPrice) {
      this.selectedMinPrice = this.minPrice;
    }
    if (this.selectedMaxPrice > this.maxPrice) {
      this.selectedMaxPrice = this.maxPrice;
    }
    this.onFilterRooms();
  }


  onSearchRooms() {
    // Gọi hàm tìm kiếm thống nhất
    this.performSearch();
    
    // Cuộn xuống kết quả
    setTimeout(() => {
      const resultSection = document.querySelector('.room-list-results');
      resultSection?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  }

  // Xử lý khi ngày đến thay đổi
  onDateChange(): void {
    // Tự động tìm kiếm khi chọn ngày
    this.performSearch();
    
    // Cuộn xuống kết quả
    setTimeout(() => {
      const resultSection = document.querySelector('.room-list-results');
      resultSection?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  }

  flattenPackages() {
    const keyword = this.keywordInput.toLowerCase();
    const maxGuest = parseInt(this.guestCountFilter || '0');

    this.allPackages = this.rawPackages.filter(pkg => {
      const guestMatch = !maxGuest || this.parseMaxGuest(pkg.range) <= maxGuest;
      const tagMatch = this.selectedTags.length === 0 || this.selectedTags.every(tag => pkg.tags.includes(tag));
      const keywordMatch = !this.keywordInput || (
        pkg.room_name.toLowerCase().includes(keyword) ||
        pkg.description.toLowerCase().includes(keyword)
      );
      return guestMatch && tagMatch && keywordMatch;
    });
  }

  parseMaxGuest(range: string): number {
    const match = range.match(/\d+/g);
    if (!match) return 0;
    return parseInt(match[1] || match[0]);
  }

  toggleGarden(garden: string) {
    const index = this.selectedGardens.indexOf(garden);
    if (index > -1) {
      this.selectedGardens.splice(index, 1);  // Bỏ chọn
    } 
    else {
      this.selectedGardens.push(garden);      // Thêm chọn
    }
    this.onFilterRooms();
  }

  toggleAllGardens(event: any) {
    const checked = event.target.checked;
    if (checked) {
      this.selectedGardens = [...this.gardenTags]; // Chọn hết
    } 
    else {
      this.selectedGardens = []; // Bỏ hết
    }
    this.onFilterRooms();
  }

  toggleSpaceTag(tag: string): void {
  const index = this.selectedSpaceTags.indexOf(tag);
  if (index > -1) {
    this.selectedSpaceTags.splice(index, 1);
  } else {
    this.selectedSpaceTags.push(tag);
  }
  this.onFilterRooms();
}

  toggleShowAllSpaceTags(): void {
    this.showAllSpaceTags = !this.showAllSpaceTags;
  }


  isAllGardensSelected(): boolean {
    return this.gardenTags.every(tag => this.selectedGardens.includes(tag));
  }
  
  parseGuestRange(range: string): [number, number] {
    if (!range) return [0, 0];
    // Parse range như "1-2 người", "3-5 người", "6-10 người"
    const match = range.match(/(\d+)\s*-\s*(\d+)/);
    if (match && match.length >= 3) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      return [min, max];
    }
    // Nếu chỉ có 1 số
    const singleMatch = range.match(/(\d+)/);
    if (singleMatch) {
      const num = parseInt(singleMatch[1], 10);
      return [num, num];
    }
    return [0, 0];
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('vi-VN') + ' VND';
  }

  // Set ngày tối thiểu (hôm nay) để không cho chọn ngày trong quá khứ
  setMinDate(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.minDate = `${year}-${month}-${day}`;
  }

  // Hiển thị tất cả phòng (reset tất cả filter)
  showAllRooms(): void {
    // Reset tất cả filter
    this.keywordInput = '';
    this.checkinDate = '';
    this.selectedMinPrice = this.minPrice;
    this.selectedMaxPrice = this.maxPrice;
    this.sortOrder = '';
    this.guestCountFilter = '';
    this.selectedTags = [];
    this.selectedGardens = [];
    this.selectedSpaceTags = [];

    // Hiển thị tất cả phòng từ originalPackages
    this.allPackages = [...this.originalPackages];

    // Cuộn xuống kết quả
    setTimeout(() => {
      const resultSection = document.querySelector('.room-list-results');
      resultSection?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  }

  // Xử lý khi input từ khóa thay đổi (real-time search - optional)
  onKeywordChange(): void {
    // Có thể thêm debounce ở đây nếu muốn real-time search
    // Hiện tại chỉ search khi submit form
  }
}
