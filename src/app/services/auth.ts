import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserService } from './user';
import { User } from '../interfaces/user';

/** Kiểu dữ liệu tài khoản dùng trong app */
export interface Account {
  id: number;
  ho_ten: string;
  email: string;
  phone_number?: string;
  diem_tich_luy: number;   // dùng tính hạng
  diem_kha_dung: number;   // điểm hiện có
  star?: number;           // điểm star
}

/** LocalStorage keys */
const LS_TOKEN_KEY = 'panacea_token';
const LS_ACC_KEY   = 'panacea_account';
const LS_UID_KEY   = 'UID';
const LS_CURRENT_USER = 'CURRENT_USER';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentAccountSubject = new BehaviorSubject<Account | null>(null);
  public currentAccount$ = this.currentAccountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {
    // Khôi phục account từ localStorage khi service khởi tạo
    this.loadAccountFromStorage();
  }

  private loadAccountFromStorage(): void {
    const userStr = localStorage.getItem(LS_CURRENT_USER);
    if (userStr) {
      try {
        const user: User = JSON.parse(userStr);
        const account = this.convertUserToAccount(user);
        this.currentAccountSubject.next(account);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  private convertUserToAccount(user: User): Account {
    return {
      id: parseInt(user.user_id.replace('US', '')) || 0,
      ho_ten: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      diem_tich_luy: user.star || 0,
      diem_kha_dung: user.coin || 0,
      star: user.star || 0
    };
  }

  login(emailOrPhone: string, password: string): Observable<any> {
    // Đảm bảo users đã được load từ users.json trước
    // Load trực tiếp từ users.json để đảm bảo dữ liệu mới nhất
    return this.http.get<User[]>('assets/data/users.json').pipe(
      map((usersFromJson: User[]) => {
        const normalizedInput = emailOrPhone.toLowerCase().trim();
        
        // Tìm user trong users.json
        const user = usersFromJson.find(u => {
          const normalizedEmail = (u.email || '').toLowerCase().trim();
          const normalizedPhone = (u.phone_number || '').replace(/[^\d+]/g, '');
          const normalizedInputPhone = normalizedInput.replace(/[^\d+]/g, '');
          
          // So sánh email hoặc phone (có thể nhập 0... hoặc +84...)
          const emailMatch = normalizedEmail === normalizedInput;
          const phoneMatch = normalizedPhone === normalizedInputPhone || 
                            (normalizedInputPhone.startsWith('0') && normalizedPhone === '+84' + normalizedInputPhone.substring(1)) ||
                            (normalizedPhone.startsWith('+84') && normalizedInputPhone === normalizedPhone.substring(3));
          
          return (emailMatch || phoneMatch) &&
                 u.password === password &&
                 (u.account_status === 'active' || u.account_status === undefined);
        });

        if (!user) {
          throw new Error('wrong_password');
        }

        // Đảm bảo user có đầy đủ thông tin từ users.json
        const finalUser: User = {
          user_id: user.user_id,
          email: user.email,
          phone_number: user.phone_number,
          full_name: user.full_name,
          gender: user.gender || '',
          birthdate: user.birthdate || '',
          city: user.city || '',
          coin: user.coin || 0,
          star: user.star || 0,
          password: user.password,
          two_factor_enabled: user.two_factor_enabled || false,
          account_status: user.account_status || 'active',
          role: user.role || 'user', // Đảm bảo role được lấy từ users.json
          last_login: new Date().toISOString(),
          created_at: user.created_at
        };

        // Cập nhật lại users list trong localStorage với dữ liệu mới nhất từ users.json
        // Đảm bảo toàn bộ users list được sync từ users.json
        const usersList: User[] = usersFromJson.map((u: any) => ({
          user_id: u.user_id || `US${Date.now()}`,
          email: u.email || '',
          phone_number: u.phone_number || '',
          full_name: u.full_name || '',
          gender: u.gender || '',
          birthdate: u.birthdate || '',
          city: u.city || '',
          coin: u.coin || 0,
          star: u.star || 0,
          password: u.password || '',
          two_factor_enabled: u.two_factor_enabled || false,
          account_status: u.account_status || 'active',
          role: u.role || 'user',
          last_login: u.user_id === finalUser.user_id ? new Date().toISOString() : u.last_login,
          created_at: u.created_at
        }));
        
        // Lưu toàn bộ users list đã được sync từ users.json vào localStorage
        localStorage.setItem('USERS', JSON.stringify(usersList));

        // Lưu vào localStorage với dữ liệu mới nhất từ users.json (bao gồm role)
        localStorage.setItem(LS_CURRENT_USER, JSON.stringify(finalUser));
        localStorage.setItem(LS_UID_KEY, finalUser.user_id);
        localStorage.setItem(LS_TOKEN_KEY, 'token_' + Date.now());
        
        const account = this.convertUserToAccount(finalUser);
        localStorage.setItem(LS_ACC_KEY, JSON.stringify(account));
        
        // Trigger update để các component khác reload dữ liệu
        this.currentAccountSubject.next(account);

        return { success: true, user: finalUser, account };
      }),
      catchError((error: any) => {
        // Nếu là lỗi wrong_password từ map, throw lại ngay
        if (error.message === 'wrong_password') {
          return throwError(() => new Error('wrong_password'));
        }
        
        // Nếu không load được từ users.json (lỗi HTTP), thử từ localStorage (fallback)
        console.warn('Cannot load users.json, trying localStorage fallback:', error);
        
        const users = this.userService.getAllUsersPublic();
        if (users.length === 0) {
          return throwError(() => new Error('wrong_password'));
        }
        
        const normalizedInput = emailOrPhone.toLowerCase().trim();
        const user = users.find(u => {
          const normalizedEmail = (u.email || '').toLowerCase().trim();
          const normalizedPhone = (u.phone_number || '').replace(/[^\d+]/g, '');
          const normalizedInputPhone = normalizedInput.replace(/[^\d+]/g, '');
          
          const emailMatch = normalizedEmail === normalizedInput;
          const phoneMatch = normalizedPhone === normalizedInputPhone || 
                            (normalizedInputPhone.startsWith('0') && normalizedPhone === '+84' + normalizedInputPhone.substring(1)) ||
                            (normalizedPhone.startsWith('+84') && normalizedInputPhone === normalizedPhone.substring(3));
          
          return (emailMatch || phoneMatch) &&
                 u.password === password &&
                 (u.account_status === 'active' || u.account_status === undefined);
        });

        if (!user) {
          return throwError(() => new Error('wrong_password'));
        }

        // Lưu user từ localStorage (có thể không có role nếu chưa sync từ users.json)
        const finalUser: User = {
          ...user,
          last_login: new Date().toISOString()
        };

        localStorage.setItem(LS_CURRENT_USER, JSON.stringify(finalUser));
        localStorage.setItem(LS_UID_KEY, finalUser.user_id);
        localStorage.setItem(LS_TOKEN_KEY, 'token_' + Date.now());
        
        const account = this.convertUserToAccount(finalUser);
        localStorage.setItem(LS_ACC_KEY, JSON.stringify(account));
        this.currentAccountSubject.next(account);

        return of({ success: true, user: finalUser, account });
      })
    );
  }

  logout(): void {
    localStorage.removeItem(LS_TOKEN_KEY);
    localStorage.removeItem(LS_ACC_KEY);
    localStorage.removeItem(LS_UID_KEY);
    localStorage.removeItem(LS_CURRENT_USER);
    this.currentAccountSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(LS_TOKEN_KEY) && !!localStorage.getItem(LS_CURRENT_USER);
  }

  getCurrentAccount(): Observable<Account | null> {
    if (!this.isLoggedIn()) {
      return of(null);
    }

    const userStr = localStorage.getItem(LS_CURRENT_USER);
    if (userStr) {
      try {
        const user: User = JSON.parse(userStr);
        const account = this.convertUserToAccount(user);
        this.currentAccountSubject.next(account);
        return of(account);
      } catch (e) {
        return of(null);
      }
    }

    return of(null);
  }

  /**
   * Kiểm tra xem user hiện tại có phải admin không
   */
  isAdmin(): boolean {
    if (!this.isLoggedIn()) {
      return false;
    }

    const userStr = localStorage.getItem(LS_CURRENT_USER);
    if (userStr) {
      try {
        const user: User = JSON.parse(userStr);
        return user.role === 'admin';
      } catch (e) {
        return false;
      }
    }

    return false;
  }

  /**
   * Lấy thông tin user hiện tại (bao gồm role)
   */
  getCurrentUser(): User | null {
    if (!this.isLoggedIn()) {
      return null;
    }

    const userStr = localStorage.getItem(LS_CURRENT_USER);
    if (userStr) {
      try {
        const user: User = JSON.parse(userStr);
        return user;
      } catch (e) {
        return null;
      }
    }

    return null;
  }
}
