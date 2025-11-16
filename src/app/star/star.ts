import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SEOService } from '../services/seo.service';

@Component({
  selector: 'app-star',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star.html',
  styleUrl: './star.css',
})
export class Star implements OnInit, AfterViewInit {
  constructor(
    private seoService: SEOService
  ) {}

  ngOnInit(): void {
    this.seoService.updateSEO({
      title: 'Panacea Priority - Hệ Thống Hạng Thành Viên',
      description: 'Tìm hiểu về hệ thống Panacea Priority - Tích điểm, lên hạng và nhận các đặc quyền độc quyền từ Bronze đến Diamond.',
      keywords: 'Panacea Priority, hạng thành viên Panacea, Bronze Silver Gold Diamond, đặc quyền Panacea',
      image: '/assets/images/BACKGROUND.webp'
    });
  }

  ngAfterViewInit(): void {
    // Sử dụng setTimeout để đảm bảo DOM đã render xong
    setTimeout(() => {
      this.setupTabs();
      this.setupAccordion();
    }, 100);
  }

  isPopupOpen = false;

  openPopup(): void {
    this.isPopupOpen = true;
  }

  closePopup(): void {
    this.isPopupOpen = false;
  }

  private setupTabs(): void {
    const tabs = document.querySelectorAll<HTMLButtonElement>('.tab');
    const panels = document.querySelectorAll<HTMLElement>('.tab-panel');

    tabs.forEach(tab => {
      tab.onclick = () => {
        // Xóa active từ tất cả tabs
        tabs.forEach(t => t.classList.remove('active'));
        // Thêm active cho tab được click
        tab.classList.add('active');

        // Ẩn/hiện panels
        const targetTabId = tab.getAttribute('data-tab');
        panels.forEach(panel => {
          if (panel.id === targetTabId) {
            panel.classList.remove('hidden');
          } else {
            panel.classList.add('hidden');
          }
        });
      };
    });
  }

  private setupAccordion(): void {
    // Sử dụng event delegation để xử lý tất cả accordion headers
    const faqSection = document.querySelector('.faq');
    if (!faqSection) return;

    faqSection.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const header = target.closest('.accordion-header') as HTMLButtonElement;
      
      if (header) {
        e.preventDefault();
        e.stopPropagation();
        const item = header.parentElement as HTMLElement;
        if (item && item.classList.contains('accordion-item')) {
          item.classList.toggle('active');
        }
      }
    });
  }

}