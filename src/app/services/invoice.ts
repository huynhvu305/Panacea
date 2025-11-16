import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private usersUrl = 'assets/data/users.json';
  private roomUrl = 'assets/data/room.json';
  private servicesUrl = 'assets/data/services.json';
  private headerUrl = 'assets/data/header.json';

  constructor(private http: HttpClient) {}

  getUser(): Observable<any> {
    const uid = localStorage.getItem('UID');
    if (!uid) {
      return new Observable((observer) => {
        observer.next(null);
        observer.complete();
      });
    }

    return this.http.get<any[]>(this.usersUrl).pipe(
      map((users: any[]) => {
        const user = users.find((u) => String(u.id) === uid);
        return user || null;
      })
    );
  }

  updateUserPoints(userId: number, newPoints: number): Observable<any> {
    return this.http.get<any[]>(this.usersUrl).pipe(
      map((users: any[]) => {
        const userIndex = users.findIndex((u) => u.id === userId);
        if (userIndex !== -1) {
          users[userIndex].point = newPoints;
          // Lưu vào localStorage để đồng bộ
          localStorage.setItem('USERS', JSON.stringify(users));
          return users[userIndex];
        }
        return null;
      })
    );
  }

  getRoom(): Observable<any> {
    return this.http.get(this.roomUrl);
  }

  getHeader(): Observable<any> {
    return this.http.get(this.headerUrl);
  }

  getServices(): Observable<any> {
    return this.http.get(this.servicesUrl);
  }

  saveBooking(data: any): Observable<any> {
    console.log('Đã lưu đặt phòng:', data);
    return new Observable((observer) => {
      setTimeout(() => {
        observer.next({ success: true });
        observer.complete();
      }, 800);
    });
  }
}
