import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Voucher } from '../interfaces/voucher';
import { Items } from '../interfaces/items';

@Injectable({ providedIn: 'root' })
export class VoucherService {
  private voucherUrl = '/src/assets/data/vouchers.json';
  private itemsUrl = '/src/assets/data/items.json';

  constructor(private http: HttpClient) {}

  getVouchers(): Observable<Voucher[]> {
    return this.http.get<Voucher[]>(this.voucherUrl);
  }

  getItems(): Observable<Items[]> {
    return this.http.get<Items[]>(this.itemsUrl);
  }
}
