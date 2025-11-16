import { Component, AfterViewInit, OnDestroy, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SEOService } from '../services/seo.service';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './privacy.html',
  styleUrls: ['./privacy.css'],
})
export class PrivacyComponent implements OnInit, AfterViewInit, OnDestroy {
  updated = new Date().toLocaleDateString('vi-VN');
  private io?: IntersectionObserver;
  isLoggedIn = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private seoService: SEOService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.seoService.updateSEO({
      title: 'Chính Sách Quyền Riêng Tư - Panacea',
      description: 'Chính sách quyền riêng tư của Panacea - Thông tin về cách chúng tôi thu thập, sử dụng, bảo vệ và chia sẻ dữ liệu cá nhân của bạn khi sử dụng dịch vụ đặt phòng.',
      keywords: 'Chính sách quyền riêng tư Panacea, bảo mật dữ liệu, bảo vệ thông tin cá nhân, quyền riêng tư đặt phòng',
      image: '/assets/images/BACKGROUND.webp'
    });
  }

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;
    const links = Array.from(host.querySelectorAll<HTMLAnchorElement>('.toc-list a'));
    const ids = links.map(a => a.getAttribute('href') || '')
                     .filter(h => h.startsWith('#'))
                     .map(h => h.slice(1));
    const sections = ids
      .map(id => host.querySelector<HTMLElement>('#' + id))
      .filter((s): s is HTMLElement => !!s);

    const activate = (id: string) => {
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    };

    this.io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) activate((e.target as HTMLElement).id);
      }
    }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 1] });

    sections.forEach(sec => this.io!.observe(sec));

    // smooth scroll
    links.forEach(a => {
      a.addEventListener('click', (ev) => {
        const href = a.getAttribute('href') || '';
        if (href.startsWith('#')) {
          ev.preventDefault();
          const target = host.querySelector(href);
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', href);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
  }
}

