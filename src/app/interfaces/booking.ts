import { Room } from './room';
import { Voucher } from './voucher';  

/**
 * Interface cho dịch vụ đi kèm trong booking
 */
export interface BookingService {
  id?: number;                // ID duy nhất cho dịch vụ
  name: string;              // Tên dịch vụ
  price: number;             // Giá dịch vụ (giá đơn vị)
  quantity?: number;          // Số lượng (mặc định 1)
  type?: string;             // Loại dịch vụ (expert/extra)
  description?: string;      // Mô tả chi tiết
  icon?: string;             // Icon hiển thị (Bootstrap icon)
  active?: boolean;          // Trạng thái tick chọn trong UI
}

/**
 * Đơn đặt phòng (Booking)
 * Liên kết với Room, Voucher (qua voucherCode) và BookingService.
 */
export interface Booking {
  id: string;                           // Mã đơn đặt phòng
  userId?: string;                      // ID người dùng đặt phòng
  roomId: string | number;              // FK → Room.id (có thể là string hoặc number)
  room?: Room;                          // Thông tin chi tiết phòng (optional)
  range: string;                        // Phạm vi sức chứa đã chọn
  services: BookingService[];           // Danh sách dịch vụ đi kèm

  startTime: string;                    // Giờ bắt đầu sử dụng mm:hh dd/mm/yyyy
  endTime: string;                      // Giờ kết thúc sử dụng mm:hh dd/mm/yyyy
  checkInTime: string;                  // Giờ nhận phòng mm:hh dd/mm/yyyy
  checkOutTime: string;                 // Giờ trả phòng mm:hh dd/mm/yyyy

  // 🔗 Liên kết đến voucher.ts qua voucherCode
  voucherCode?: Voucher['code'] | string | null;        // Mã giảm giá (tham chiếu type Voucher.code)
  voucherDiscountType?: string;         // Loại giảm giá (fixed/percent)
  discountValue?: number;               // Số tiền giảm thực tế
  basePrice?: number;                   // Giá phòng (giá/giờ × số giờ)
  totalPrice: number;                   // Tổng tiền sau giảm

  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show'; // Trạng thái

  // Thông tin khách hàng nhập trong form
  customerName: string;
  customerPhone: string;
  customerEmail: string;

  rewardPointsEarned?: number;          // Số điểm Xu nhận được
  createdAt?: string;                    // Ngày tạo đơn
}
