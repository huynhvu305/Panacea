import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  robots?: string; // e.g., 'noindex, nofollow'
  type?: string; // e.g., 'product', 'website'
  structuredData?: any; // JSON-LD structured data
}

@Injectable({
  providedIn: 'root'
})
export class SEOService {
  private defaultTitle = 'Panacea - A medicine from the stars';
  private defaultDescription = 'Không gian trị liệu và chữa lành tâm hồn - Panacea cung cấp các dịch vụ thiền, yoga, tư vấn tâm lý và nhiều hoạt động chữa lành khác.';
  private defaultKeywords = 'Panacea, trị liệu, chữa lành, thiền, yoga, tư vấn tâm lý, không gian thư giãn';
  private defaultImage = '/assets/images/BACKGROUND.webp';

  constructor(
    private titleService: Title,
    private metaService: Meta
  ) {}

  updateSEO(data: SEOData): void {
    if (data.title) {
      this.titleService.setTitle(data.title);
      if (typeof document !== 'undefined') {
        document.title = data.title;
      }
    } else {
      this.titleService.setTitle(this.defaultTitle);
    }

    const description = data.description || this.defaultDescription;
    if (this.metaService.getTag('name="description"')) {
      this.metaService.updateTag({ name: 'description', content: description });
    } else {
      this.metaService.addTag({ name: 'description', content: description });
    }

    if (data.keywords) {
      if (this.metaService.getTag('name="keywords"')) {
        this.metaService.updateTag({ name: 'keywords', content: data.keywords });
      } else {
        this.metaService.addTag({ name: 'keywords', content: data.keywords });
      }
    }

    const ogTitle = data.title || this.defaultTitle;
    const ogDescription = data.description || this.defaultDescription;
    const ogImage = data.image || this.defaultImage;
    const ogUrl = data.url || window.location.href;

    this.updateOrCreateMetaTag('property', 'og:title', ogTitle);
    this.updateOrCreateMetaTag('property', 'og:description', ogDescription);
    this.updateOrCreateMetaTag('property', 'og:image', ogImage);
    this.updateOrCreateMetaTag('property', 'og:url', ogUrl);
    this.updateOrCreateMetaTag('property', 'og:type', 'website');

    this.updateOrCreateMetaTag('name', 'twitter:card', 'summary_large_image');
    this.updateOrCreateMetaTag('name', 'twitter:title', ogTitle);
    this.updateOrCreateMetaTag('name', 'twitter:description', ogDescription);
    this.updateOrCreateMetaTag('name', 'twitter:image', ogImage);

    if (data.robots) {
      this.updateOrCreateMetaTag('name', 'robots', data.robots);
    }

    if (data.structuredData) {
      this.addStructuredData(data.structuredData);
    }
  }

  /**
   * Add JSON-LD structured data to the page
   */
  private addStructuredData(data: any): void {
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Create Product Schema for structured data
   */
  createProductSchema(data: {
    name: string;
    description: string;
    image: string;
    price: number;
    currency?: string;
    availability?: string;
  }): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: data.name,
      description: data.description,
      image: data.image,
      offers: {
        '@type': 'Offer',
        price: data.price,
        priceCurrency: data.currency || 'VND',
        availability: data.availability || 'https://schema.org/InStock'
      }
    };
  }

  private updateOrCreateMetaTag(attr: string, selector: string, content: string): void {
    const existingTag = this.metaService.getTag(`${attr}="${selector}"`);
    if (existingTag) {
      this.metaService.updateTag({ [attr]: selector, content });
    } else {
      this.metaService.addTag({ [attr]: selector, content });
    }
  }
}

