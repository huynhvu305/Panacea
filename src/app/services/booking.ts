import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Room } from '../interfaces/room';
import { ServiceGroup, ServiceItem } from '../interfaces/service';
import { Voucher } from '../interfaces/voucher';
import { Booking } from '../interfaces/booking';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private ROOM_URL = 'assets/data/room.json';
  private ADD_SERVICE_URL = 'assets/data/addservice.json';
  private VOUCHER_URL = 'assets/data/voucher.json';
  private BOOKINGS_URL = 'assets/data/bookings.json';

  constructor(private http: HttpClient) { }

  // ======= LẤY DỮ LIỆU JSON =======
  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(this.ROOM_URL);
  }

  getAddServiceGroups(): Observable<ServiceGroup[]> {
    return this.http.get<ServiceGroup[]>(this.ADD_SERVICE_URL);
  }

  getServicesByRoom(roomId: string): Observable<ServiceItem[]> {
    return this.getAddServiceGroups().pipe(
      map(groups => groups.find(g => g.roomId.toString() === roomId)?.services ?? [])
    );
  }

  getVouchers(): Observable<Voucher[]> {
    return this.http.get<Voucher[]>(this.VOUCHER_URL);
  }

  getBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.BOOKINGS_URL);
  }

  // ======= TÍNH GIÁ & TÍNH ĐIỂM =======
  calculateTotal(
    roomPrice: number,
    selectedServices: ServiceItem[],
    discountValue = 0
  ): { originalPrice: number; totalPrice: number; rewardPoints: number } {
    const servicesTotal = selectedServices.reduce(
      (sum, s) => sum + (s.price || 0),
      0
    );
    const originalPrice = roomPrice + servicesTotal;
    const total = Math.max(0, originalPrice - discountValue);
    const rewardPoints = Math.floor(total * 0.01);
    return { originalPrice, totalPrice: total, rewardPoints };
  }

  // ======= ÁP DỤNG MÃ GIẢM GIÁ =======
  applyVoucher(
    voucherCode: string | undefined,
    originalPrice: number,
    vouchers: Voucher[]
  ): { discountValue: number; message: string } {
    if (!voucherCode) return { discountValue: 0, message: '' };

    const code = voucherCode.trim().toUpperCase();
    const v = vouchers.find(x => x.code.toUpperCase() === code);
    if (!v) return { discountValue: 0, message: '❌ Mã không hợp lệ hoặc đã hết hạn.' };

    if (v.minOrderValue && originalPrice < v.minOrderValue) {
      return { discountValue: 0, message: `❌ Đơn tối thiểu ${v.minOrderValue.toLocaleString()}đ.` };
    }

    let discount = 0;
    if (v.discountType === 'percent') {
      discount = Math.floor((originalPrice * (v.discountValue || 0)) / 100);
    } else if (v.discountType === 'fixed') {
      discount = Math.floor(v.discountValue || 0);
    }

    if (v.maxDiscountAmount) {
      discount = Math.min(discount, v.maxDiscountAmount);
    }

    return { discountValue: discount, message: `✅ Giảm ${discount.toLocaleString()}đ` };
  }

  // ======= TẠO ĐƠN ĐẶT PHÒNG =======
  buildBooking(d: {
    room: Room;
    services: ServiceItem[];
    range: string;
    startTime: string;       // mm:hh dd/MM/yyyy
    endTime: string;         // mm:hh dd/MM/yyyy
    checkInTime: string;     // mm:hh dd/MM/yyyy
    checkOutTime: string;    // mm:hh dd/MM/yyyy
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    voucherCode?: Voucher['code'];
    vouchers?: Voucher[];
  }): Booking {
    const { originalPrice } = this.calculateTotal(d.room.price, d.services, 0);
    const { discountValue } = this.applyVoucher(
      d.voucherCode,
      originalPrice,
      d.vouchers ?? []
    );
    const totals = this.calculateTotal(d.room.price, d.services, discountValue);

    const booking: Booking = {
      id: this.generateBookingId(),
      roomId: String((d.room as any).room_id ?? ''),
      room: d.room,
      range: d.range,
      services: d.services,
      startTime: d.startTime,
      endTime: d.endTime,
      checkInTime: d.checkInTime,
      checkOutTime: d.checkOutTime,
      voucherCode: d.voucherCode,
      discountValue,
      totalPrice: totals.totalPrice,
      status: 'pending',
      customerName: d.customerName,
      customerPhone: d.customerPhone,
      customerEmail: d.customerEmail,
      rewardPointsEarned: totals.rewardPoints
    };

    return booking;
  }

  // ======= LOCAL STORAGE =======
  saveBookingLocal(b: Booking): void {
    const key = 'bookings';
    const curr = this.getLocalBookings();
    curr.push(b);
    localStorage.setItem(key, JSON.stringify(curr));
  }

  getLocalBookings(): Booking[] {
    const key = 'bookings';
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as Booking[]) : [];
    } catch {
      return [];
    }
  }

  private generateBookingId(): string {
    const rnd = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `BKG-${rnd}`;
  }
}
