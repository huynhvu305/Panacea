export interface Voucher {
  code: string;          // mã voucher (prefix)
  type: string;          // loại voucher / tiêu đề hiển thị
  img: string;           // đường dẫn ảnh hiển thị trên thẻ
  startDate?: string;
  endDate?: string;
  pointsRequired: number;
  status?: 'Còn hiệu lực' | 'Hết hạn' | 'Đã sử dụng';
  discountType?: 'percent' | 'fixed'; // Kiểu giảm giá
  discountValue?: number;             // Giá trị giảm (VD: 10 = 10% hoặc 50000 = 50.000 VND)
  minOrderValue?: number;             // Đơn tối thiểu để áp dụng
  maxDiscountAmount?: number;         // Giảm tối đa được phép
  description?: string;
  minTransaction?: string;
  payment?: string;
  userType?: string;
}

