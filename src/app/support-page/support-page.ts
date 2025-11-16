import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { CreateTicketDto, FAQ, Ticket } from '../interfaces/support';
import { SupportService } from '../services/support';
import { SEOService } from '../services/seo.service';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-support-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './support-page.html',
  styleUrls: ['./support-page.css']
})
export class SupportPageComponent implements OnInit, OnDestroy {
  // Data
  faqs: FAQ[] = [];
  tickets: Ticket[] = [];

  // UI state
  openFaqIndex: number | null = null;
  submitting = false;
  submitSuccess = false;
  
  // Carousel state
  currentPage = 0;
  itemsPerPage = 7;

  // Search + filter
  searchControl = new FormControl<string>('', { nonNullable: true });
  selectedCategory: string | null = null;

  // Form
  supportForm!: FormGroup;

  // Permissions
  showTickets = false;

  // logged-in flag (DO NOT call localStorage from template)
  isLoggedIn = false;

  // Categories for the "Phân loại theo sản phẩm" grid
  productCategories: { key: string; label: string; icon: string }[] = [
    { key: 'Thông tin chung', label: 'Thông tin chung', icon: 'bi bi-info-circle' },
    { key: 'Đặt phòng', label: 'Đặt phòng & Lịch', icon: 'bi bi-calendar-check' },
    { key: 'Catharsis', label: 'Catharsis - Vườn An Nhiên', icon: 'bi bi-flower1' },
    { key: 'Oasis', label: 'Oasis - Vườn Tâm Hồn', icon: 'bi bi-droplet' },
    { key: 'Genii', label: 'Genii - Vườn Cảm Hứng', icon: 'bi bi-palette' },
    { key: 'Mutiny', label: 'Mutiny - Vườn Cách Mạng', icon: 'bi bi-lightning' },
    { key: 'Thanh toán', label: 'Thanh toán', icon: 'bi bi-credit-card' },
    { key: 'Panacea Points', label: 'Panacea Points', icon: 'bi bi-coin' },
    { key: 'Tài khoản', label: 'Tài khoản và bảo mật', icon: 'bi bi-person-circle' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private supportService: SupportService,
    private route: ActivatedRoute,
    private router: Router,
    private seoService: SEOService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // SEO
    this.seoService.updateSEO({
      title: 'Trung Tâm Hỗ Trợ Panacea',
      description: 'Trung tâm hỗ trợ Panacea - Tìm câu trả lời cho các câu hỏi thường gặp, liên hệ với chúng tôi và gửi yêu cầu hỗ trợ.',
      keywords: 'Hỗ trợ Panacea, FAQ Panacea, câu hỏi thường gặp, liên hệ Panacea, trung tâm hỗ trợ',
      image: '/assets/images/BACKGROUND.webp'
    });

    // Initialize reactive form
    this.supportForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      category: ['', [Validators.required]],
      subject: ['', [Validators.required]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      attachment: this.fb.control<File | null>(null)
    });

    // set logged-in flag once (read from AuthService)
    this.isLoggedIn = this.authService.isLoggedIn();

    // Load FAQs + Tickets
    this.supportService.getFaqs().pipe(takeUntil(this.destroy$)).subscribe((faqs) => (this.faqs = faqs));
    this.supportService.getTickets().pipe(takeUntil(this.destroy$)).subscribe((ts) => (this.tickets = ts));

    // Admin/demo ticket list visibility (localStorage or ?role=)
    const roleFromStorage = (localStorage.getItem('userRole') || '').toLowerCase();
    const isAdminOrDemoStored = roleFromStorage === 'admin' || roleFromStorage === 'demo';
    this.route.queryParamMap
      .pipe(
        map((p) => {
          const r = (p.get('role') || '').toLowerCase();
          return r === 'admin' || r === 'demo';
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((isAdminQuery) => (this.showTickets = isAdminQuery || isAdminOrDemoStored));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Computed FAQ list by search + selected category
  get filteredFaqs(): FAQ[] {
    const q = (this.searchControl.value || '').toLowerCase().trim();
    return this.faqs.filter((f) => {
      const matchText = f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
      const matchCat = this.selectedCategory ? (f as any).category === this.selectedCategory : true;
      return matchText && matchCat;
    });
  }

  get popularTopics(): FAQ[] {
    return this.filteredFaqs.slice(0, 6);
  }

  get paginatedFaqs(): FAQ[] {
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredFaqs.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredFaqs.length / this.itemsPerPage);
  }

  get canGoPrev(): boolean {
    return this.currentPage > 0;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  goToPrev(): void {
    if (this.canGoPrev) {
      this.currentPage--;
      this.openFaqIndex = null; // Đóng tất cả accordion khi chuyển trang
    }
  }

  goToNext(): void {
    if (this.canGoNext) {
      this.currentPage++;
      this.openFaqIndex = null; // Đóng tất cả accordion khi chuyển trang
    }
  }

  // Search submit (no navigation; just filter client-side)
  onSearchSubmit(): void {
    // no-op; filtering is reactive by getter. Keep for accessibility submit key.
  }

  clearFilter(): void {
    this.selectedCategory = null;
    this.currentPage = 0; // Reset về trang đầu khi clear filter
  }

  selectCategory(cat: string): void {
    this.selectedCategory = cat;
    this.currentPage = 0; // Reset về trang đầu khi filter
  }

  toggleFaq(idx: number): void {
    this.openFaqIndex = this.openFaqIndex === idx ? null : idx;
  }

  isFaqOpen(idx: number): boolean {
    return this.openFaqIndex === idx;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.supportForm.get('attachment')?.setValue(file);
  }

  get f() {
    return this.supportForm.controls;
  }

  resetForm(): void {
    const attachmentValue = this.supportForm.get('attachment')?.value;
    
    const formValue = this.supportForm.value;
    this.supportForm.reset();
    
    if (attachmentValue) {
      this.supportForm.get('attachment')?.setValue(attachmentValue);
    } else {
      const fileInput = document.getElementById('attachment') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  submit(): void {
    this.submitSuccess = false;
    if (this.supportForm.invalid) {
      this.supportForm.markAllAsTouched();
      return;
    }
    this.submitting = true;

    const val = this.supportForm.value;
    const file: File | null = (val.attachment as File | null) ?? null;
    let attachmentUrl: string | undefined;
    if (file) {
      try {
        attachmentUrl = URL.createObjectURL(file);
      } catch { /* ignore */ }
    }

    const dto: CreateTicketDto = {
      name: String(val.name),
      email: String(val.email),
      category: String(val.category),
      subject: String(val.subject),
      message: String(val.message),
      attachmentUrl
    };

    this.supportService.createTicket(dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.submitting = false;
        this.submitSuccess = true;
        this.supportForm.reset();
        setTimeout(() => (this.submitSuccess = false), 3000);
      },
      error: () => (this.submitting = false)
    });
  }

  // CTA navigation
  gotoLogin(): void {
    this.router.navigate(['/login']);
  }

  gotoRegister(): void {
    this.router.navigate(['/register']);
  }
}