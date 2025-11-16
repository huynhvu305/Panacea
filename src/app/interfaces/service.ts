export interface ServiceGroup {
  roomId: number;            // Liên kết với Room.id
  roomName: string;          // Tên hiển thị của phòng
  services: ServiceItem[];    // Danh sách dịch vụ riêng của phòng
}

export interface ServiceItem {
  id?: number;                // ID duy nhất cho dịch vụ
  name: string;              // Tên dịch vụ
  price: number;             // Giá dịch vụ (giá đơn vị)
  quantity?: number;          // Số lượng (mặc định 1)
  type?: string;             // Loại dịch vụ (expert/extra)
  description?: string;      // Mô tả chi tiết
  icon?: string;             // Icon hiển thị (Bootstrap icon)
  active?: boolean;          // Trạng thái tick chọn trong UI
  selected?: boolean;        // Trạng thái được chọn
}

export interface ServicesData {
  expertServices: ServiceItem[];
  extraServices: ServiceItem[];
}

