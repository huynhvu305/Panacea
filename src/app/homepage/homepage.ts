import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SEOService } from '../services/seo.service';

type Garden = {
  key: 'an-nhien' | 'tam-hon' | 'cam-hung' | 'cach-mang';
  title: string;
  subtitle: string;
  desc: string;
  link: string;
  cover: string;
};


type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Khách mới' | string;

type Feedback = {
  name: string;
  tier?: Tier;
  role?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
};

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css']
})
export class Homepage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroVideo') heroVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('introSection') introSectionRef!: ElementRef<HTMLElement>;
  @ViewChild('gardensSection') gardensSectionRef!: ElementRef<HTMLElement>;
  @ViewChild('prioritySection') prioritySectionRef!: ElementRef<HTMLElement>;
  @ViewChild('feedbackSection') feedbackSectionRef!: ElementRef<HTMLElement>;
  @ViewChild('dateInput') dateInputRef!: ElementRef<HTMLInputElement>;

  // Flags để track sections đã load
  gardensLoaded = false;
  priorityLoaded = false;
  feedbackLoaded = false;

  // Stats counter animation
  private statsObserver?: IntersectionObserver;
  private statsAnimated = false;
  // Giá trị số thực tế để đếm
  statNumbers: number[] = [4, 20, 10];
  // Giá trị hiện tại đang đếm
  currentStatValues: number[] = [0, 0, 0];

  private observer?: IntersectionObserver;
  private scrollRevealObserver?: IntersectionObserver;

  private preloadLink?: HTMLLinkElement;

  constructor(
    private router: Router,
    private seoService: SEOService,
    @Inject(DOCUMENT) private document: Document
  ) {
    console.log('Homepage component đã được khởi tạo!');
  }

  ngOnInit(): void {
    this.seoService.updateSEO({
      title: 'Panacea - A medicine from the stars',
      description: 'Không gian trị liệu và chữa lành tâm hồn - Panacea cung cấp các dịch vụ thiền, yoga, tư vấn tâm lý và nhiều hoạt động chữa lành khác.',
      keywords: 'Panacea, trị liệu, chữa lành, thiền, yoga, tư vấn tâm lý, không gian thư giãn, Catharsis, Oasis, Genii, Mutiny',
      image: '/assets/images/BACKGROUND.webp'
    });

    // Thêm preload link cho video để trình duyệt tải sớm (tối ưu LCP)
    this.addVideoPreload();
  }

  private addVideoPreload(): void {
    const head = this.document.getElementsByTagName('head')[0];
    if (head) {
      // Kiểm tra xem link đã tồn tại chưa
      const existingLink = head.querySelector('link[rel="preload"][as="video"][href*="panacea.webm"]');
      if (!existingLink) {
        this.preloadLink = this.document.createElement('link');
        this.preloadLink.rel = 'preload';
        this.preloadLink.as = 'video';
        this.preloadLink.href = 'assets/video/panacea.webm';
        this.preloadLink.setAttribute('fetchpriority', 'high');
        head.appendChild(this.preloadLink);
      }
    }
  }

  private removeVideoPreload(): void {
    if (this.preloadLink && this.preloadLink.parentNode) {
      this.preloadLink.parentNode.removeChild(this.preloadLink);
      this.preloadLink = undefined;
    }
  }

  ngAfterViewInit() {
    if (this.heroVideoRef?.nativeElement) {
      const video = this.heroVideoRef.nativeElement;
      
      // Đảm bảo video luôn muted
      video.muted = true;
      video.volume = 0;
      
      // Tối ưu loading: load video ngay lập tức
      video.load();
      
      // Đảm bảo video tự động play khi component load
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log('Auto-play bị chặn, cần user interaction:', err);
        });
      }
      
      // Đảm bảo video luôn muted khi có sự kiện
      video.addEventListener('volumechange', () => {
        if (!video.muted) {
          video.muted = true;
          video.volume = 0;
        }
      });
    }

    // Setup Intersection Observer cho lazy loading sections
    this.setupIntersectionObserver();
    
    // Setup Intersection Observer cho scroll reveal animation
    setTimeout(() => {
      this.setupScrollReveal();
      this.setupStatsObserver();
    }, 150);
  }

  ngOnDestroy() {
    // Cleanup observers
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.scrollRevealObserver) {
      this.scrollRevealObserver.disconnect();
    }
    if (this.statsObserver) {
      this.statsObserver.disconnect();
    }
    
    // Xóa preload link khi component bị destroy
    this.removeVideoPreload();
  }

  private setupIntersectionObserver() {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '200px', // Load trước 200px khi scroll đến để mượt hơn
      threshold: 0.01 // Trigger ngay khi 1% section vào viewport
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          const sectionId = target.getAttribute('data-section');

          switch (sectionId) {
            case 'gardens':
              if (!this.gardensLoaded) {
                console.log('🌿 Gardens section đang load...');
                this.gardensLoaded = true;
                this.loadGardenImages();
              }
              break;
            case 'priority':
              if (!this.priorityLoaded) {
                console.log('⭐ Priority section đang load...');
                this.priorityLoaded = true;
              }
              break;
            case 'feedback':
              if (!this.feedbackLoaded) {
                console.log('💬 Feedback section đang load...');
                this.feedbackLoaded = true;
              }
              break;
          }

          // Unobserve sau khi đã load
          this.observer?.unobserve(target);
        }
      });
    }, options);

    // Observe các sections - tạo sentinel elements thay vì observe sections trực tiếp
    setTimeout(() => {
      // Tạo sentinel cho gardens section
      this.createSentinel('gardens', this.gardensSectionRef);
      // Tạo sentinel cho priority section
      this.createSentinel('priority', this.prioritySectionRef);
      // Tạo sentinel cho feedback section
      this.createSentinel('feedback', this.feedbackSectionRef);
    }, 100);
  }

  private createSentinel(sectionId: string, sectionRef: ElementRef<HTMLElement> | undefined) {
    if (!sectionRef?.nativeElement) return;

    // Observe section trực tiếp (đơn giản và hiệu quả hơn)
    this.observer?.observe(sectionRef.nativeElement);
  }

  private loadGardenImages() {
    // Preload garden images khi section vào viewport
    this.gardens.forEach(garden => {
      const img = new Image();
      img.src = garden.cover;
    });
  }

  private setupScrollReveal(): void {
    const options: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.scrollRevealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Unobserve sau khi đã animate để tối ưu performance
          this.scrollRevealObserver?.unobserve(entry.target);
        }
      });
    }, options);

    // Tìm tất cả các elements cần animate
    const elementsToReveal = document.querySelectorAll('.scroll-reveal');
    elementsToReveal.forEach(el => {
      this.scrollRevealObserver?.observe(el);
    });
  }

  // ========== HOME VIDEO ==========
  videoSrc = 'assets/video/panacea.webm';
  videoPoster = 'assets/images/BACKGROUND.webp';

  // ========== SEARCH BAR ==========
  activeTab: 'book' | 'guide' = 'book';
  isActive(tab: string) { return this.activeTab === tab as any; }
  setTab(tab: 'book' | 'guide') { this.activeTab = tab; }

  // Khu vườn - dùng checkbox như room-list
  gardenTags: string[] = ['Oasis', 'Catharis', 'Genii', 'Mutiny'];
  selectedGardens: string[] = [];
  
  zones = [
    { key: 'all', label: 'Tất cả', garden: '' },
    { key: 'an-nhien', label: 'An Nhiên', garden: 'Oasis' },
    { key: 'tam-hon', label: 'Tâm Hồn', garden: 'Catharis' },
    { key: 'cam-hung', label: 'Cảm Hứng', garden: 'Genii' },
    { key: 'cach-mang', label: 'Cách Mạng', garden: 'Mutiny' }
  ];
  
  servicesMap: Record<string, string[]> = {
    'an-nhien': ['Thiền định', 'Yoga Flow', 'Massage Thảo mộc'],
    'tam-hon': ['Tham vấn 1:1', 'Viết nhật ký có hướng dẫn'],
    'cam-hung': ['Workshop Vẽ', 'Phòng Âm nhạc'],
    'cach-mang': ['VR Game', 'Thử thách thể lực']
  };

  zone = 'all';
  service = '';
  date: string = '';
  time: string = '';
  promo: string = '';
  guestCountFilter: string = '';
  
  // Filter properties - đơn giản hóa
  minPrice: number = 200000;
  maxPrice: number = 1250000;
  selectedMinPrice: any = this.minPrice;
  selectedMaxPrice: any = this.maxPrice;
  
  formatCurrency(value: number): string {
    return value.toLocaleString('vi-VN') + ' VND';
  }
  
  resetPrice() {
    this.selectedMinPrice = this.minPrice.toLocaleString('vi-VN');
    this.selectedMaxPrice = this.maxPrice.toLocaleString('vi-VN');
  }
  
  onPriceInput(event: any, type: 'min' | 'max') {
    // Chỉ lưu số thô khi đang gõ, không format
    let value = event.target.value.replace(/\D/g, ''); // Chỉ giữ số
    
    // Giới hạn số tối đa là 9.999.999
    if (value) {
      const numValue = parseInt(value);
      if (numValue > 9999999) {
        value = '9999999';
      } else {
        value = numValue.toString();
      }
    }
    
    // Lưu số thô khi đang gõ (không format)
    if (type === 'min') {
      this.selectedMinPrice = value;
    } else {
      this.selectedMaxPrice = value;
    }
  }
  
  onPriceBlur(event: any, type: 'min' | 'max') {
    // Format với dấu chấm khi blur (rời khỏi input)
    let value = event.target.value.replace(/\D/g, '');
    
    if (value) {
      const numValue = parseInt(value);
      if (numValue > 9999999) {
        value = '9999999';
      }
      const formatted = numValue.toLocaleString('vi-VN');
      
      if (type === 'min') {
        this.selectedMinPrice = formatted;
      } else {
        this.selectedMaxPrice = formatted;
      }
    }
  }
  
  onPriceKeyDown(event: any, type: 'min' | 'max') {
    // Format khi nhấn Enter
    if (event.key === 'Enter') {
      event.preventDefault();
      let value = event.target.value.replace(/\D/g, '');
      
      if (value) {
        const numValue = parseInt(value);
        if (numValue > 9999999) {
          value = '9999999';
        }
        const formatted = numValue.toLocaleString('vi-VN');
        
        if (type === 'min') {
          this.selectedMinPrice = formatted;
        } else {
          this.selectedMaxPrice = formatted;
        }
      }
    }
  }
  
  getPriceValue(price: any): number {
    if (!price) return 0;
    const numStr = String(price).replace(/\./g, '');
    return parseInt(numStr) || 0;
  }
  
  getZoneButtonLabel(zone: any): string {
    if (zone.key === 'all') {
      return zone.label;
    }
    return `${zone.garden} - ${zone.label}`;
  }

  selectZone(zoneKey: string) {
    this.zone = zoneKey;
    if (zoneKey === 'all') {
      // Chọn tất cả gardens
      this.selectedGardens = [...this.gardenTags];
    } else {
      // Chọn garden tương ứng
      const zoneGarden = this.zones.find(z => z.key === zoneKey)?.garden;
      if (zoneGarden) {
        this.selectedGardens = [zoneGarden];
      }
    }
    // Reset service khi đổi zone
    if (zoneKey !== 'all') {
      const list = this.servicesMap[zoneKey] || [];
      this.service = list[0] ?? '';
    } else {
      this.service = '';
    }
  }

  toggleAllGardens(event: any) {
    const checked = event.target.checked;
    if (checked) {
      this.selectedGardens = [...this.gardenTags];
      this.zone = 'all';
    } else {
      this.selectedGardens = [];
      this.zone = 'all';
    }
  }
  
  isAllGardensSelected(): boolean {
    return this.selectedGardens.length === this.gardenTags.length;
  }

  openDatePicker() {
    // Mở date picker khi click vào icon calendar
    if (this.dateInputRef?.nativeElement) {
      const input = this.dateInputRef.nativeElement;
      // Thử dùng showPicker() nếu có, nếu không thì dùng click()
      if (input.showPicker) {
        try {
          input.showPicker();
        } catch (error) {
          input.click();
        }
      } else {
        input.click();
      }
    }
  }

  onSearch() {
    // Chuyển đến trang room-list với query params
    const queryParams: any = {};
    
    // Truyền gardens filter
    if (this.selectedGardens.length > 0 && this.zone !== 'all') {
      queryParams.gardens = this.selectedGardens.join(',');
    }
    
    // Truyền guest count filter
    if (this.guestCountFilter) {
      queryParams.guests = this.guestCountFilter;
    }
    
    // Truyền price filter (chuyển từ format có dấu chấm về số)
    const minPriceValue = this.getPriceValue(this.selectedMinPrice);
    const maxPriceValue = this.getPriceValue(this.selectedMaxPrice);
    
    // Luôn truyền giá để room-list có thể set filter
    queryParams.minPrice = minPriceValue || this.minPrice;
    queryParams.maxPrice = maxPriceValue || this.maxPrice;
    
    // Navigate đến room-list với query params
    this.router.navigate(['/room-list'], { queryParams });
  }

  // ========== GARDENS ==========
  gardens: Garden[] = [
    {
      key: 'an-nhien',
      title: 'Oasis — An Nhiên',
      subtitle: 'Meditation & Mindfulness',
      desc: 'Không gian thiền tĩnh, yoga, thư giãn. Tìm về bình an nội tâm với các gói: Tĩnh Tâm (1-2 người), Chia Sẻ (3-5 người), Workshop Tĩnh (6-10 người).',
      link: '/room-list',
      cover: 'assets/images/tinh_tam.webp',
    },
    {
      key: 'tam-hon',
      title: 'Catharsis — Thư Giãn',
      subtitle: 'Yoga & Balance',
      desc: 'Không gian yoga, thiền, cân bằng năng lượng. Các gói: Thư Giãn (1-2 người), Cân Bằng (3-5 người), Đồng Điệu (6-10 người).',
      link: '/room-list',
      cover: 'assets/images/catharsis_room_1.webp',
    },
    {
      key: 'cam-hung',
      title: 'Genii — Cảm Hứng',
      subtitle: 'Creative Arts',
      desc: 'Không gian sáng tạo, nghệ thuật, workshop. Các gói: Sáng Tác (1-2 người), Nghệ Thuật (3-5 người), Workshop Sáng Tạo (6-10 người).',
      link: '/room-list',
      cover: 'assets/images/sang_tac.webp',
    },
    {
      key: 'cach-mang',
      title: 'Mutiny — Cách Mạng',
      subtitle: 'Gaming & Play',
      desc: 'Không gian gaming, VR, giải trí, xả stress. Các gói: Rage & Game (1-2 người), Chiến Hữu (3-5 người), Đại Náo (6-10 người).',
      link: '/room-list',
      cover: 'assets/images/rage.webp',
    },
  ];

  trackByKey = (_: number, g: Garden) => g.key;

  // Map key sang tên garden trong room-list
  getGardenName(key: string): string {
    const map: Record<string, string> = {
      'an-nhien': 'Oasis',
      'tam-hon': 'Catharis',
      'cam-hung': 'Genii',
      'cach-mang': 'Mutiny'
    };
    return map[key] || '';
  }

  goToRoomList(garden: Garden, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    const gardenName = this.getGardenName(garden.key);
    if (gardenName) {
      this.router.navigate(['/room-list'], { queryParams: { garden: gardenName } });
    } else {
      this.router.navigate(['/room-list']);
    }
  }


  // ========== FEEDBACK ==========
  feedbackItems: Feedback[] = [
    {
      name: 'Ngọc Anh',
      tier: 'Diamond',
      role: 'Thành viên Diamond',
      rating: 5,
      text: 'Không gian đẹp, dịch vụ rất chill. Mình thích nhất khu Bình Yên và phần chăm sóc khách hàng.'
    },
    {
      name: 'Hoàng Duy',
      tier: 'Gold',
      role: 'Thành viên Gold',
      rating: 5,
      text: 'App dễ dùng, đặt lịch nhanh. Có thêm vài khung giờ tối muộn thì tuyệt.'
    },
    {
      name: 'Minh Phúc',
      tier: 'Khách mới',
      role: 'Khách hàng',
      rating: 5,
      text: 'Nhân viên nhiệt tình, ưu đãi rõ ràng. Mình sẽ rủ bạn bè quay lại.'
    }
  ];

  // Setup Intersection Observer cho stats counter
  private setupStatsObserver() {
    this.statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.statsAnimated) {
            this.statsAnimated = true;
            this.animateStats();
            this.statsObserver?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.3, // Kích hoạt khi 30% section hiển thị
        rootMargin: '0px'
      }
    );

    // Quan sát intro section
    if (this.introSectionRef?.nativeElement) {
      this.statsObserver.observe(this.introSectionRef.nativeElement);
    }
  }

  // Hàm easing để animation mượt mà hơn (easeOutQuart)
  private easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  // Hàm đếm số từ 0 đến giá trị cuối
  private animateStats() {
    const duration = 1800; // 1.8 giây
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      let progress = elapsed / duration;
      
      // Đảm bảo progress không vượt quá 1
      if (progress >= 1) {
        progress = 1;
        // Set giá trị cuối cùng ngay lập tức khi hoàn thành
        this.statNumbers.forEach((target, index) => {
          this.currentStatValues[index] = target;
        });
        return; // Dừng animation
      }
      
      // Sử dụng easing để đếm nhanh ở đầu, chậm lại ở cuối
      const easedProgress = this.easeOutQuart(progress);
      
      // Cập nhật tất cả các số cùng lúc
      this.statNumbers.forEach((target, index) => {
        const currentValue = Math.round(target * easedProgress);
        // Đảm bảo không vượt quá giá trị đích
        this.currentStatValues[index] = Math.min(currentValue, target);
      });

      // Tiếp tục animation
      requestAnimationFrame(animate);
    };

    // Bắt đầu animation ngay lập tức
    requestAnimationFrame(animate);
  }

  // Hàm format số để hiển thị (thêm dấu +)
  formatStatValue(index: number): string {
    const value = this.currentStatValues[index];
    return value.toString() + '+';
  }

  getInitial(name: string) {
    if (!name) return '?';
    const p = name.trim().split(/\s+/);
    return (p[0][0] + (p[1]?.[0] || '')).toUpperCase();
  }

  getStars(n: number) {
    return Array.from({ length: Math.max(0, Math.min(5, n)) });
  }

  getTierClass(tier?: Tier) {
    const t = (tier || '').toLowerCase();
    if (t.includes('diamond')) return 'fb-badge--diamond';
    if (t.includes('gold')) return 'fb-badge--gold';
    if (t.includes('silver')) return 'fb-badge--silver';
    if (t.includes('bronze')) return 'fb-badge--bronze';
    if (t.includes('khách mới') || t.includes('mới')) return 'fb-badge--default';
    return 'fb-badge--default';
  }
}
