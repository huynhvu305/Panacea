import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private promptEvent: any = null;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.handleInstallPrompt();
  }

  /**
   * Kiểm tra và cài đặt service worker
   */
  async initPwa(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Lấy registration hiện tại hoặc đăng ký mới
        this.registration = await navigator.serviceWorker.getRegistration() || 
                            await navigator.serviceWorker.register('/sw.js', {
                              scope: '/'
                            });

        console.log('[PWA] Service Worker registered:', this.registration.scope);

        // Lắng nghe update
        this.handleUpdateAvailable();

        // Kiểm tra khi service worker đã sẵn sàng
        if (this.registration.waiting) {
          console.log('[PWA] Service Worker waiting');
        }

        if (this.registration.active) {
          console.log('[PWA] Service Worker active');
        }

        // Kiểm tra update định kỳ (mỗi 6 giờ)
        setInterval(() => {
          this.checkForUpdates();
        }, 6 * 60 * 60 * 1000);
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    } else {
      console.warn('[PWA] Service Workers are not supported in this browser');
    }
  }

  /**
   * Kiểm tra update từ Service Worker
   */
  checkForUpdates(): void {
    if (this.registration) {
      this.registration.update();
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          this.registration = reg;
          reg.update();
        }
      });
    }
  }

  /**
   * Xử lý khi có update mới
   */
  handleUpdateAvailable(): void {
    if (this.registration) {
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available');
              this.showUpdateNotification();
            }
          });
        }
      });
    }
  }

  /**
   * Hiển thị thông báo có update mới
   */
  private showUpdateNotification(): void {
    if (confirm('Có phiên bản mới của Panacea! Bạn có muốn cập nhật ngay bây giờ?')) {
      this.updateApp();
    }
  }

  /**
   * Cập nhật ứng dụng
   */
  async updateApp(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      // Gửi message đến service worker để skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    } else {
      // Fallback: reload page
      window.location.reload();
    }
  }

  /**
   * Xử lý install prompt (BeforeInstallPrompt event)
   */
  private handleInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.promptEvent = e;
      console.log('[PWA] Install prompt available');
      this.showInstallButton();
    });

    // Kiểm tra xem app đã được cài đặt chưa
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      this.promptEvent = null;
      this.hideInstallButton();
    });
  }

  /**
   * Hiển thị nút cài đặt
   */
  private showInstallButton(): void {
    // Có thể thêm logic để hiển thị nút install trong UI
    // Ví dụ: set một flag để component hiển thị banner install
  }

  /**
   * Ẩn nút cài đặt
   */
  private hideInstallButton(): void {
    // Ẩn nút install khi app đã được cài đặt
  }

  /**
   * Hiển thị install prompt
   */
  async promptInstall(): Promise<boolean> {
    if (!this.promptEvent) {
      console.warn('[PWA] Install prompt not available');
      return false;
    }

    try {
      this.promptEvent.prompt();
      const { outcome } = await this.promptEvent.userChoice;
      console.log('[PWA] User choice:', outcome);
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install');
      } else {
        console.log('[PWA] User dismissed install');
      }
      
      this.promptEvent = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }

  /**
   * Kiểm tra xem app có đang chạy ở chế độ standalone không
   */
  isStandalone(): boolean {
    return (
      (window.matchMedia('(display-mode: standalone)').matches) ||
      ((window.navigator as any).standalone === true) ||
      document.referrer.includes('android-app://')
    );
  }

  /**
   * Kiểm tra xem service worker có được hỗ trợ không
   */
  isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Kiểm tra xem app có đang offline không
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Lắng nghe sự kiện online/offline
   */
  onOnlineStatusChange(callback: (isOnline: boolean) => void): void {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
}

