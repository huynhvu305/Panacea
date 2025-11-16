import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SEOService } from '../services/seo.service';

@Component({
  selector: 'app-story',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './story.html',
  styleUrls: ['./story.css']
})
export class StoryComponent implements OnInit, AfterViewInit, OnDestroy {
  private observer?: IntersectionObserver;

  constructor(private seoService: SEOService) {}

  ngOnInit() {
    // SEO
    this.seoService.updateSEO({
      title: 'Cốt truyện - Panacea',
      description: 'Cốt truyện về hành trình của Linh qua vũ trụ Panacea - nơi những giấc mơ bị lãng quên khẽ gọi tên. Khám phá 4 hành tinh: Catharis, Genii, Oasis và Mutiny.',
      keywords: 'Cốt truyện Panacea, hành trình Linh, Catharis, Genii, Oasis, Mutiny, chữa lành tâm hồn',
      image: '/assets/images/Panacea1.webp'
    });
  }

  ngAfterViewInit() {
    // Tạo Intersection Observer để detect khi các phần tử vào viewport
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-reveal-active');
          // Không remove class để giữ animation sau khi đã hiện
        }
      });
    }, {
      threshold: 0.1, // Trigger khi 10% phần tử vào viewport
      rootMargin: '0px 0px -100px 0px' // Trigger sớm hơn một chút
    });

    // Observe tất cả các phần tử cần scroll reveal
    setTimeout(() => {
      const selectors = [
        '.intro-title-cell',
        '.reach-panel',
        '.falling-panel',
        '.intro-text-cell',
        '.intro-bottom-text',
        '.universe-image-wrapper',
        '.quote-text',
        '.planet-item',
        '.planet-image-wrapper',
        '.planet-content',
        '.reality-text',
        '.section-title',
        '.panacea-logo-wrapper',
        '.cta-content'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.classList.add('scroll-reveal');
          this.observer?.observe(el);
        });
      });

      // Vẫn observe các strong tags như cũ
      const strongElements = document.querySelectorAll('.intro-panel-text strong, .intro-description-text strong, .planet-description strong, .reality-text strong');
      strongElements.forEach(el => {
        this.observer?.observe(el);
      });
    }, 100);

  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}