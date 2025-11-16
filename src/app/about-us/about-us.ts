import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SEOService } from '../services/seo.service';

type Stat = { label: string; value: string; note?: string };
type ValueItem = { icon: string; title: string; desc: string };
type TimelineItem = { month: string; title: string; desc: string };

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about-us.html',
  styleUrls: ['./about-us.css']
})
export class AboutUsComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly year = new Date().getFullYear();
  private observer?: IntersectionObserver;
  private statsObserver?: IntersectionObserver;
  private statsAnimated = false;

  stats: Stat[] = [
    { value: '2.000+', label: 'Khách đã trải nghiệm', note: 'trong năm 2024' },
    { value: '500+',  label: 'Đánh giá 5 Sao',           note: 'từ cộng đồng' },
    { value: '20+',   label: 'Hoạt động trị liệu',     note: 'đa dạng & an toàn' },
    { value: '10+',   label: 'Đối tác chuyên gia',     note: 'tâm lý & thiền' },
  ];

  // Giá trị số thực tế để đếm
  statNumbers: number[] = [2000, 500, 20, 10];
  // Giá trị hiện tại đang đếm
  currentStatValues: number[] = [0, 0, 0, 0];

  values: ValueItem[] = [
    { icon: 'bi-heart-pulse',  title: 'Chữa lành vững bền',    desc: 'Tập trung liệu pháp an toàn, theo dõi tiến trình cá nhân.' },
    { icon: 'bi-stars',        title: 'Trải nghiệm giàu cảm xúc', desc: 'Không gian thư giãn, hoạt động đa giác quan có chủ đích.' },
    { icon: 'bi-shield-check', title: 'Bảo mật & tôn trọng',   desc: 'Tôn trọng quyền riêng tư và đa dạng sắc thái cảm xúc.' },
  ];

  coreValues: ValueItem[] = [
    { icon: 'bi-sun', title: 'Khách hàng là tâm điểm', desc: 'Chúng tôi luôn tận tâm, chu đáo và xây dựng niềm tin lâu dài.' },
    { icon: 'bi-sun', title: 'Uy tín – Rõ ràng', desc: 'Chúng tôi cam kết dịch vụ chất lượng, an toàn và minh bạch trong mọi quy trình.' },
    { icon: 'bi-sun', title: 'Đa dạng dịch vụ', desc: 'Chúng tôi đáp ứng nhu cầu đa dạng và luôn lắng nghe phản hồi để nâng cao chất lượng.' },
    { icon: 'bi-sun', title: 'Giá cả hợp lý', desc: 'Cung cấp mức giá phù hợp với nhiều phân khúc khách hàng' },
  ];

  timeline: TimelineItem[] = [
    { 
      month: 'Tháng 10/2024', 
      title: 'Hạt mầm ý tưởng', 
      desc: 'Panacea ra đời từ sự thấu cảm với áp lực và kiệt sức mà người trẻ đang đối mặt. Chúng tôi nhận thấy nhu cầu về một nền tảng công nghệ đáng tin cậy, giúp kết nối các dịch vụ "chữa lành" vốn đang rời rạc tại Việt Nam.' 
    },
    { 
      month: 'Tháng 11/2024', 
      title: 'Tìm thấy Panacea', 
      desc: 'Cái tên "Panacea" (Người chữa lành tất cả) được chọn để thể hiện sứ mệnh của dự án. Slogan "a medicine from the stars" cũng ra đời, định vị Panacea là một liều thuốc tinh thần đến từ vũ trụ.' 
    },
    { 
      month: 'Tháng 01/2025', 
      title: 'Kiến tạo Bốn Khu Vườn', 
      desc: 'Từ câu chuyện của Linh, chúng tôi hệ thống hóa trải nghiệm thành "Bốn Khu vườn" (An Nhiên, Tâm Hồn, Cảm Hứng, Cách Mạng). Đây là bước ngoặt biến một ý tưởng trừu tượng thành một mô hình dịch vụ rõ ràng, đáp ứng đa dạng nhu cầu cảm xúc.' 
    },
    { 
      month: 'Tháng 02/2025', 
      title: 'Định hình nhận diện', 
      desc: 'Bộ nhận diện thương hiệu được hoàn thiện với logo tối giản, hiện đại và hình ảnh ngôi sao cách điệu. Bảng màu chủ đạo (Xanh, Be, Trắng) được lựa chọn kỹ lưỡng để xoa dịu tâm hồn và giảm gánh nặng thị lực cho người dùng.' 
    },
    { 
      month: 'Tháng 03/2025', 
      title: 'Phác thảo bản vẽ công nghệ', 
      desc: 'Chúng tôi bắt đầu biến ý tưởng thành trải nghiệm số bằng cách vạch ra chi tiết Hành trình khách hàng (Customer Journey) và các Quy trình nghiệp vụ (BPMN). Những bản thiết kế (prototype) đầu tiên trên Figma ra đời, đặt nền móng kỹ thuật cho website.' 
    },
    { 
      month: 'Hiện tại', 
      title: 'Sẵn sàng cho hành trình mới', 
      desc: 'Sau nhiều tháng tinh chỉnh chiến lược và thiết kế, nền tảng Panacea đang trong giai đoạn hoàn thiện. Chúng tôi tự hào về hành trình đã qua và sẵn sàng mang "vũ trụ chữa lành" này đến gần hơn với cộng đồng.' 
    },
  ];

  partners = ['MoMo','ACB','HSBC','Vietcombank','MB','Citibank','VietinBank','TPBank','BIDV'];

  team = [
    { name: 'Phan Hồng Ngọc', role: 'Project Lead & Strategist', avatar: 'assets/images/hongngoc.webp' },
    { name: 'Trương Quốc Bảo', role: 'Business Analyst', avatar: 'assets/images/quocbao.webp' },
    { name: 'Lương Hoàng Thái', role: 'UI/UX & Concept Designer', avatar: 'assets/images/hoangthai.webp' },
    { name: 'Huỳnh Văn Vũ', role: 'Front-end Developer - Angular', avatar: 'assets/images/vanvu.webp' },
    { name: 'Lâm Thùy Dung', role: 'Database & Integration Developer', avatar: 'assets/images/thuydung.webp' },
  ];

  constructor(
    private elementRef: ElementRef,
    private seoService: SEOService
  ) {}

  ngOnInit() {
    // SEO
    this.seoService.updateSEO({
      title: 'Về Chúng Tôi - Panacea',
      description: 'Tìm hiểu về Panacea - Nơi chữa lành tâm hồn dành cho bạn. Sứ mệnh, giá trị cốt lõi, câu chuyện và đội ngũ của chúng tôi.',
      keywords: 'Về Panacea, giới thiệu Panacea, sứ mệnh Panacea, đội ngũ Panacea, câu chuyện Panacea',
      image: '/assets/images/BACKGROUND.webp'
    });

    // Khởi tạo Intersection Observer cho lazy load
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Ngừng quan sát sau khi đã hiển thị
            this.observer?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1, // Kích hoạt khi 10% phần tử hiển thị
        rootMargin: '0px 0px -50px 0px' // Kích hoạt sớm hơn một chút
      }
    );

    // Khởi tạo Intersection Observer riêng cho stats section
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
        threshold: 0.3, // Kích hoạt khi 30% stats section hiển thị
        rootMargin: '0px'
      }
    );
  }

  ngAfterViewInit() {
    // Quan sát tất cả các section và phần tử cần lazy load
    const sections = this.elementRef.nativeElement.querySelectorAll('section');
    sections.forEach((section: HTMLElement) => {
      this.observer?.observe(section);
    });

    // Quan sát các phần tử con trong sections
    const lazyElements = this.elementRef.nativeElement.querySelectorAll('.lazy-load');
    lazyElements.forEach((element: HTMLElement) => {
      this.observer?.observe(element);
    });

    // Quan sát stats section để kích hoạt đếm số
    const statsSection = this.elementRef.nativeElement.querySelector('.stats');
    if (statsSection) {
      this.statsObserver?.observe(statsSection);
    }

    // Hiển thị hero section ngay lập tức
    const heroSection = this.elementRef.nativeElement.querySelector('.hero');
    if (heroSection) {
      heroSection.classList.add('visible');
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.statsObserver) {
      this.statsObserver.disconnect();
    }
  }

  // Hàm easing để animation mượt mà hơn (easeOutQuart - mượt hơn easeOutCubic)
  private easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  // Hàm đếm số từ 0 đến giá trị cuối
  animateStats() {
    const duration = 1800; // 1.8 giây - nhanh hơn một chút
    const startTime = performance.now(); // Sử dụng performance.now() thay vì Date.now() để chính xác hơn

    const animate = () => {
      const elapsed = performance.now() - startTime;
      let progress = elapsed / duration;
      
      // Đảm bảo progress không vượt quá 1
      if (progress >= 1) {
        progress = 1;
        // Set giá trị cuối cùng ngay lập tức khi hoàn thành
        this.stats.forEach((stat, index) => {
          this.currentStatValues[index] = this.statNumbers[index];
        });
        return; // Dừng animation
      }
      
      // Sử dụng easing để đếm nhanh ở đầu, chậm lại ở cuối (nhưng mượt hơn)
      const easedProgress = this.easeOutQuart(progress);
      
      // Cập nhật tất cả các số cùng lúc
      this.stats.forEach((stat, index) => {
        const targetValue = this.statNumbers[index];
        // Sử dụng Math.round thay vì Math.floor để mượt hơn ở cuối
        const currentValue = Math.round(targetValue * easedProgress);
        // Đảm bảo không vượt quá giá trị đích
        this.currentStatValues[index] = Math.min(currentValue, targetValue);
      });

      // Tiếp tục animation
      requestAnimationFrame(animate);
    };

    // Bắt đầu animation ngay lập tức
    requestAnimationFrame(animate);
  }

  // Hàm format số để hiển thị (thêm dấu chấm và dấu +)
  formatStatValue(index: number): string {
    const value = this.currentStatValues[index];
    const formatted = value.toLocaleString('vi-VN', { useGrouping: true }).replace(/,/g, '.');
    return formatted + '+';
  }
}
