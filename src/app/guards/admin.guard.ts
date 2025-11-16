import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Kiểm tra xem user có đăng nhập không
  if (!authService.isLoggedIn()) {
    console.log('[AdminGuard] User chưa đăng nhập, redirect đến /login');
    // Redirect đến trang login với returnUrl
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Kiểm tra role
  if (!authService.isAdmin()) {
    const currentUser = authService.getCurrentUser();
    console.warn('[AdminGuard] User không phải admin, bị chặn truy cập admin panel', {
      userId: currentUser?.user_id,
      email: currentUser?.email,
      role: currentUser?.role,
      attemptedUrl: state.url
    });
    // Nếu không phải admin, redirect về trang chủ hoặc /login
    router.navigate(['/login']);
    return false;
  }

  console.log('[AdminGuard] User là admin, cho phép truy cập admin panel');
  return true;
};

