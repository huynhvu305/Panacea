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

  gardensLoaded = false;
  priorityLoaded = false;
  feedbackLoaded = false;

  private statsObserver?: IntersectionObserver;
  private statsAnimated = false;
  statNumbers: number[] = [4, 20, 10];
  currentStatValues: number[] = [0, 0, 0];

  private observer?: IntersectionObserver;
  private scrollRevealObserver?: IntersectionObserver;

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
  }

  ngAfterViewInit() {
    if (this.heroVideoRef?.nativeElement) {
      const video = this.heroVideoRef.nativeElement;
      
      video.muted = true;
      video.volume = 0;
      
      video.load();
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log('Auto-play bị chặn, cần user interaction:', err);
        });
      }
      
      video.addEventListener('volumechange', () => {
        if (!video.muted) {
          video.muted = true;
          video.volume = 0;
        }
      });
    }

    this.setupIntersectionObserver();
    
    setTimeout(() => {
      this.setupScrollReveal();
      this.setupStatsObserver();
    }, 150);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.scrollRevealObserver) {
      this.scrollRevealObserver.disconnect();
    }
    if (this.statsObserver) {
      this.statsObserver.disconnect();
    }
  }

  private setupIntersectionObserver() {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '200px',
      threshold: 0.01
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

          this.observer?.unobserve(target);
        }
      });
    }, options);

    setTimeout(() => {
      this.createSentinel('gardens', this.gardensSectionRef);
      this.createSentinel('priority', this.prioritySectionRef);
      this.createSentinel('feedback', this.feedbackSectionRef);
    }, 100);
  }

  private createSentinel(sectionId: string, sectionRef: ElementRef<HTMLElement> | undefined) {
    if (!sectionRef?.nativeElement) return;

    this.observer?.observe(sectionRef.nativeElement);
  }

  private loadGardenImages() {
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
          this.scrollRevealObserver?.unobserve(entry.target);
        }
      });
    }, options);

    const elementsToReveal = document.querySelectorAll('.scroll-reveal');
    elementsToReveal.forEach(el => {
      this.scrollRevealObserver?.observe(el);
    });
  }

  videoSrc = 'assets/video/panacea.webm';
  videoPoster = 'assets/images/BACKGROUND-poster.webp';

  activeTab: 'book' | 'guide' = 'book';
  isActive(tab: string) { return this.activeTab === tab as any; }
  setTab(tab: 'book' | 'guide') { this.activeTab = tab; }

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
  
  minPrice: number = 200000;
  maxPrice: number = 1250000;
  selectedMinPrice: number = this.minPrice;
  selectedMaxPrice: number = this.maxPrice;
  
  formatCurrency(value: number): string {
    return value.toLocaleString('vi-VN') + ' VND';
  }
  
  resetPrice() {
    this.selectedMinPrice = this.minPrice;
    this.selectedMaxPrice = this.maxPrice;
  }
  
  onPriceSliderChange(type: 'min' | 'max') {
    // Đảm bảo min không lớn hơn max và ngược lại
    if (type === 'min') {
      if (this.selectedMinPrice > this.selectedMaxPrice) {
        this.selectedMinPrice = this.selectedMaxPrice;
      }
      if (this.selectedMinPrice < this.minPrice) {
        this.selectedMinPrice = this.minPrice;
      }
    } else {
      if (this.selectedMaxPrice < this.selectedMinPrice) {
        this.selectedMaxPrice = this.selectedMinPrice;
      }
      if (this.selectedMaxPrice > this.maxPrice) {
        this.selectedMaxPrice = this.maxPrice;
      }
    }
  }
  
  getMinPercent(): number {
    return ((this.selectedMinPrice - this.minPrice) / (this.maxPrice - this.minPrice)) * 100;
  }
  
  getRangePercent(): number {
    return ((this.selectedMaxPrice - this.selectedMinPrice) / (this.maxPrice - this.minPrice)) * 100;
  }
  
  getPriceValue(price: any): number {
    if (typeof price === 'number') return price;
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
      this.selectedGardens = [...this.gardenTags];
    } else {
      const zoneGarden = this.zones.find(z => z.key === zoneKey)?.garden;
      if (zoneGarden) {
        this.selectedGardens = [zoneGarden];
      }
    }
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
    if (this.dateInputRef?.nativeElement) {
      const input = this.dateInputRef.nativeElement;
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
    const queryParams: any = {};
    
    if (this.selectedGardens.length > 0 && this.zone !== 'all') {
      queryParams.gardens = this.selectedGardens.join(',');
    }
    
    if (this.guestCountFilter) {
      queryParams.guests = this.guestCountFilter;
    }
    
    // selectedMinPrice và selectedMaxPrice giờ là number, không cần convert
    queryParams.minPrice = this.selectedMinPrice || this.minPrice;
    queryParams.maxPrice = this.selectedMaxPrice || this.maxPrice;
    
    this.router.navigate(['/room-list'], { queryParams });
  }

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
        threshold: 0.3,
        rootMargin: '0px'
      }
    );

    if (this.introSectionRef?.nativeElement) {
      this.statsObserver.observe(this.introSectionRef.nativeElement);
    }
  }

  private easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  private animateStats() {
    const duration = 1800;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      let progress = elapsed / duration;
      
      if (progress >= 1) {
        progress = 1;
        this.statNumbers.forEach((target, index) => {
          this.currentStatValues[index] = target;
        });
        return;
      }
      
      const easedProgress = this.easeOutQuart(progress);
      
      this.statNumbers.forEach((target, index) => {
        const currentValue = Math.round(target * easedProgress);
        this.currentStatValues[index] = Math.min(currentValue, target);
      });

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

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
