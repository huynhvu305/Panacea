export interface Review {
    id?: string;
    userId: string;
    bookingId: string;  // Bắt buộc: phải có bookingId từ bookings.json
    rating: number;
    content: string;
    images?: string[];
    isPublic: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export interface ReviewResponse {
    success: boolean;
    pointsAdded?: number;
    review?: Review;
    message?: string;
  }
  
  export interface ReviewListItem {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    content: string;
    images?: string[];
    createdAt: Date;
  }
  
  export interface ReviewFormData {
    rating: number;
    content: string;
    images: File[];
    isPublic: boolean;
    bookingId?: string;
  }