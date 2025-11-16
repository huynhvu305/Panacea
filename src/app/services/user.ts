import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../interfaces/user';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private usersUrl = 'assets/data/users.json';
  private initialized = false;

  constructor(private http: HttpClient) {
    // Khởi tạo: đọc từ users.json và lưu vào localStorage nếu chưa có
    this.initializeUsers();
  }

  private initializeUsers(): void {
    // Luôn đọc lại từ users.json để đảm bảo dữ liệu mới nhất
    // Không check initialized để luôn sync lại
    
    // Luôn đọc từ users.json để đảm bảo có dữ liệu mới nhất
    this.http.get<User[]>(this.usersUrl).pipe(
      catchError(() => {
        // Nếu không đọc được từ users.json, thử đọc từ localStorage
        const existingUsers = localStorage.getItem('USERS');
        if (existingUsers) {
          try {
            const users = JSON.parse(existingUsers);
            this.initialized = true;
            return of(users);
          } catch (e) {
            return of([]);
          }
        }
        return of([]);
      })
    ).subscribe(users => {
      if (!users || users.length === 0) {
        // Nếu không có dữ liệu từ users.json, thử đọc từ localStorage
        const existingUsers = localStorage.getItem('USERS');
        if (existingUsers) {
          try {
            const parsedUsers = JSON.parse(existingUsers);
            this.initialized = true;
            return;
          } catch (e) {
            // Ignore
          }
        }
        this.initialized = true;
        return;
      }
      
      // Chuyển đổi dữ liệu từ users.json sang format User
      const formattedUsers: User[] = users.map((u: any) => ({
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
        role: u.role || 'user'
      }));
      
      // Merge với dữ liệu hiện có trong localStorage (ưu tiên dữ liệu từ users.json)
      const existingUsersStr = localStorage.getItem('USERS');
      let finalUsers: User[] = formattedUsers; // Mặc định dùng users từ users.json
      
      if (existingUsersStr) {
        try {
          const existingUsers: User[] = JSON.parse(existingUsersStr);
          // Merge: ưu tiên dữ liệu từ users.json cho các user đã có, giữ lại users mới từ localStorage
          const mergedUsers: User[] = [];
          
          // Thêm users từ users.json trước (ưu tiên)
          formattedUsers.forEach(userFromJson => {
            mergedUsers.push(userFromJson);
          });
          
          // Thêm users mới từ localStorage (chưa có trong users.json)
          existingUsers.forEach(existingUser => {
            const existsInJson = formattedUsers.find(u => u.user_id === existingUser.user_id);
            if (!existsInJson) {
              // Chỉ thêm user mới từ localStorage, không thêm user đã có trong users.json
              mergedUsers.push(existingUser);
            }
          });
          
          finalUsers = mergedUsers;
          localStorage.setItem('USERS', JSON.stringify(mergedUsers));
        } catch (e) {
          // Nếu parse lỗi, chỉ lưu dữ liệu từ users.json
          localStorage.setItem('USERS', JSON.stringify(formattedUsers));
        }
      } else {
        // Nếu chưa có dữ liệu trong localStorage, lưu từ users.json
        localStorage.setItem('USERS', JSON.stringify(formattedUsers));
      }
      
      this.initialized = true;
      
      // Sau khi merge xong, trigger reload account nếu đang có user đăng nhập
      const uid = localStorage.getItem('UID');
      if (uid) {
        const user = finalUsers.find((u: any) => u.user_id === uid);
        if (user) {
          // Cập nhật lại CURRENT_USER với dữ liệu mới nhất từ users.json
          localStorage.setItem('CURRENT_USER', JSON.stringify(user));
        }
      }
    });
  }

  private getAllUsers(): User[] {
    // Đảm bảo đã khởi tạo
    if (!this.initialized) {
      const usersString = localStorage.getItem('USERS');
      if (usersString) {
        this.initialized = true;
        return JSON.parse(usersString);
      }
      return [];
    }
    
    const usersString = localStorage.getItem('USERS');
    return usersString ? JSON.parse(usersString) : [];
  }

  private normalizePhone(p?: string): string {
    if (!p) return '';
    return p.toString().replace(/[^\d+]/g, '');
  }

  private normalizeEmail(e?: string): string {
    return (e || '').toLowerCase().trim();
  }

  // register nhận partial payload, tự sinh user_id
  register(userPayload: Partial<User>): Observable<any> {
    // Đảm bảo đã khởi tạo users từ users.json
    const users = this.getAllUsers();

    const normalizedEmail = this.normalizeEmail(userPayload.email);
    const normalizedPhone = this.normalizePhone(userPayload.phone_number);

    const emailExists = users.some(u => this.normalizeEmail(u.email) === normalizedEmail && normalizedEmail !== '');
    const phoneExists = users.some(u => this.normalizePhone(u.phone_number) === normalizedPhone && normalizedPhone !== '');

    const errors: any = {};
    if (emailExists) errors.email = true;
    if (phoneExists) errors.phone_number = true;
    if (Object.keys(errors).length) {
      return throwError(() => ({ errors }));
    }

    // Tạo user_id dạng string để tương thích với dữ liệu hiện có (US01, US02, ...)
    // Tìm số lớn nhất trong danh sách hiện có
    let maxId = 0;
    users.forEach(u => {
      const match = u.user_id.match(/^US(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxId) maxId = num;
      }
    });
    const newId = 'US' + String(maxId + 1).padStart(2, '0');
    
    const newUser: User = {
      user_id: newId,
      email: userPayload.email || '',
      phone_number: userPayload.phone_number || '',
      full_name: userPayload.full_name || '',
      gender: (userPayload.gender as any) || '',
      birthdate: userPayload.birthdate || '',
      city: userPayload.city || '',
      coin: 0,
      star: 0,
      password: userPayload.password || '',
      two_factor_enabled: false,
      account_status: 'active',
      role: 'user',
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('USERS', JSON.stringify(users));

    return of({ success: true, user: newUser });
  }

  getAllUsersPublic(): User[] {
    return this.getAllUsers();
  }

  updateUserInfo(updatedUser: Partial<User>): Observable<any> {
    const currentUserString = localStorage.getItem('CURRENT_USER');
    if (!currentUserString) return throwError(() => new Error('not_logged_in'));

    const currentUser = JSON.parse(currentUserString) as User;
    const users = this.getAllUsers();
    const idx = users.findIndex(u => u.user_id === currentUser.user_id);
    if (idx === -1) return throwError(() => new Error('not_found'));

    users[idx] = { ...users[idx], ...updatedUser };
    localStorage.setItem('USERS', JSON.stringify(users));
    localStorage.setItem('CURRENT_USER', JSON.stringify(users[idx]));
    return of({ success: true, user: users[idx] });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const currentUserString = localStorage.getItem('CURRENT_USER');
    if (!currentUserString) return throwError(() => new Error('Chưa đăng nhập'));

    const currentUser = JSON.parse(currentUserString);
    const users = this.getAllUsers();

    const userIndex = users.findIndex(u => u.user_id === currentUser.user_id);
    if (userIndex === -1) return throwError(() => new Error('Không tìm thấy tài khoản'));

    if (users[userIndex].password !== currentPassword) {
      return throwError(() => new Error('Mật khẩu hiện tại không đúng'));
    }

    users[userIndex].password = newPassword;
    localStorage.setItem('USERS', JSON.stringify(users));
    localStorage.setItem('CURRENT_USER', JSON.stringify(users[userIndex]));

    return of({ success: true });
  }

  updateTwoFactor(enabled: boolean): Observable<any> {
    const currentUserString = localStorage.getItem('CURRENT_USER');
    if (!currentUserString) return throwError(() => new Error('Chưa đăng nhập'));

    const currentUser = JSON.parse(currentUserString);
    const users = this.getAllUsers();

    const userIndex = users.findIndex(u => u.user_id === currentUser.user_id);
    if (userIndex === -1) return throwError(() => new Error('Không tìm thấy tài khoản'));

    users[userIndex].two_factor_enabled = enabled;
    localStorage.setItem('USERS', JSON.stringify(users));
    localStorage.setItem('CURRENT_USER', JSON.stringify(users[userIndex]));

    return of({ success: true, twoFactorEnabled: enabled });
  }

  deleteAccount(): Observable<any> {
    const currentUserString = localStorage.getItem('CURRENT_USER');
    if (!currentUserString) return throwError(() => new Error('Chưa đăng nhập'));

    const currentUser = JSON.parse(currentUserString);
    let users = this.getAllUsers();

    users = users.filter(u => u.user_id !== currentUser.user_id);
    localStorage.setItem('USERS', JSON.stringify(users));
    localStorage.removeItem('CURRENT_USER');

    return of({ success: true });
  }

  addPoints(points: number): Observable<any> {
    const currentUserString = localStorage.getItem('CURRENT_USER');
    if (!currentUserString) return throwError(() => new Error('Chưa đăng nhập'));

    const currentUser = JSON.parse(currentUserString);
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.user_id === currentUser.user_id);

    if (userIndex === -1) return throwError(() => new Error('Không tìm thấy tài khoản'));

    users[userIndex].coin = (users[userIndex].coin || 0) + points;
    localStorage.setItem('USERS', JSON.stringify(users));
    localStorage.setItem('CURRENT_USER', JSON.stringify(users[userIndex]));

    return of({ success: true, user: users[userIndex] });
  }

}