import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jsPDF } from 'jspdf';
import { Booking } from '../interfaces/booking';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  
  private fontName = 'ArialUnicodeMS';
  private fontLoaded = false;

  constructor(private http: HttpClient) {}

  /**
   * Tạo PDF hóa đơn từ thông tin booking
   */
  generateInvoice(booking: Booking, roomName: string): void {
    // Load logo trước khi tạo PDF
    this.loadLogoImage().then((logoData) => {
      this.generateInvoiceWithLogo(booking, roomName, logoData);
    }).catch(() => {
      // Nếu không load được logo, vẫn tạo PDF với text logo
      this.generateInvoiceWithLogo(booking, roomName, null);
    });
  }

  /**
   * Load logo image từ assets
   */
  private async loadLogoImage(): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = '/assets/images/SUBLOGO.webp';
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const imgData = canvas.toDataURL('image/png');
              resolve(imgData);
            } else {
              resolve(null);
            }
          } catch (error) {
            resolve(null);
          }
        };
        
        img.onerror = () => {
          resolve(null);
        };
      } catch (error) {
        resolve(null);
      }
    });
  }

  /**
   * Tạo PDF hóa đơn với logo (nếu có)
   */
  private generateInvoiceWithLogo(booking: Booking, roomName: string, logoData: string | null): void {
    // Validate input
    if (!booking) {
      console.error('Booking is required');
      return;
    }
    
    // Đảm bảo roomName có giá trị và chuyển sang không dấu
    const safeRoomName = roomName && roomName !== '—' 
      ? this.removeVietnameseAccents(roomName) 
      : 'Room not specified';
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Thử load font Arial Unicode MS nếu chưa load
    this.loadArialUnicodeFont(doc);
    
    // ========== MÀU SẮC PANACEA ==========
    const primaryBlue: [number, number, number] = [19, 47, 186]; // #132FBA
    const accentOrange: [number, number, number] = [247, 148, 29]; // #F7941D
    const textDark: [number, number, number] = [30, 36, 48]; // #1e2430
    const textLight: [number, number, number] = [100, 100, 100]; // #646464
    const borderGray: [number, number, number] = [200, 200, 200]; // #c8c8c8
    const headerBg: [number, number, number] = [245, 247, 250]; // #f5f7fa
    
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    let yPos = 20;
    
    // ========== HEADER - LOGO & TITLE ==========
    // Logo (Bên trái) - Thêm logo nếu có
    const logoWidth = 40;
    const logoHeight = 12;
    const logoX = margin;
    const logoY = yPos - 2;
    
    if (logoData) {
      // Thêm logo image vào PDF
      try {
        doc.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.warn('Could not add logo image:', error);
        // Fallback: text logo
        doc.setFontSize(20);
        this.setFont(doc, 'bold');
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.text('PANACEA', margin, yPos);
      }
    } else {
      // Fallback: text logo nếu không có logo data
      doc.setFontSize(20);
      this.setFont(doc, 'bold');
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text('PANACEA', margin, yPos);
    }
    
    // Tiêu đề hóa đơn (Bên phải)
    doc.setFontSize(20);
    this.setFont(doc, 'bold');
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    this.addText(doc, 'INVOICE', margin + 100, yPos, { align: 'right' });
    
    yPos += 15;
    
    // Đường kẻ ngang
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, margin + contentWidth, yPos);
    yPos += 10;
    
    // ========== THÔNG TIN ĐƠN HÀNG ==========
    doc.setFontSize(10);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    
    // Độ rộng cố định cho labels để căn chỉnh thẳng hàng
    const labelWidth = 35; // mm
    const valueX = margin + labelWidth;
    
    // Validate và format booking ID
    const bookingId = booking.id || 'N/A';
    this.setFont(doc, 'bold');
    this.addText(doc, `Order ID:`, margin, yPos);
    this.setFont(doc, 'normal');
    this.addText(doc, bookingId, valueX, yPos);
    yPos += 6;
    
    // Format ngày xuất hóa đơn (dd/mm/yyyy)
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const invoiceDate = `${day}/${month}/${year}`;
    this.setFont(doc, 'bold');
    this.addText(doc, `Invoice Date:`, margin, yPos);
    this.setFont(doc, 'normal');
    this.addText(doc, invoiceDate, valueX, yPos);
    yPos += 10;
    
    // ========== THÔNG TIN KHÁCH HÀNG ==========
    doc.setFontSize(11);
    this.setFont(doc, 'bold');
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    this.addText(doc, 'Customer Information', margin, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    // Validate customer info và chuyển sang không dấu
    const customerName = this.removeVietnameseAccents(booking.customerName || 'Not specified');
    const customerEmail = booking.customerEmail || 'N/A';
    const customerPhone = booking.customerPhone || 'N/A';
    
    // Sử dụng cùng labelWidth và valueX để căn chỉnh thẳng hàng
    this.setFont(doc, 'bold');
    this.addText(doc, `Customer Name:`, margin, yPos);
    this.setFont(doc, 'normal');
    this.addText(doc, customerName, valueX, yPos);
    yPos += 6;
    
    this.setFont(doc, 'bold');
    this.addText(doc, `Email:`, margin, yPos);
    this.setFont(doc, 'normal');
    this.addText(doc, customerEmail, valueX, yPos);
    yPos += 6;
    
    this.setFont(doc, 'bold');
    this.addText(doc, `Phone:`, margin, yPos);
    this.setFont(doc, 'normal');
    this.addText(doc, customerPhone, valueX, yPos);
    yPos += 10;
    
    // ========== THÔNG TIN ĐẶT PHÒNG ==========
    doc.setFontSize(11);
    this.setFont(doc, 'bold');
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    this.addText(doc, 'Booking Information', margin, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    // Validate booking info và chuyển sang không dấu
    const bookingRange = this.removeVietnameseAccents(booking.range || 'N/A');
    
    // Sử dụng cùng labelWidth và valueX để căn chỉnh thẳng hàng
    this.setFont(doc, 'bold');
    this.addText(doc, `Room:`, margin, yPos);
    this.setFont(doc, 'normal');
    this.addText(doc, safeRoomName, valueX, yPos);
    yPos += 6;
    
    this.setFont(doc, 'bold');
    this.addText(doc, `Capacity:`, margin, yPos);
    this.setFont(doc, 'normal');
    this.addText(doc, bookingRange, valueX, yPos);
    yPos += 6;
    
    // Format thời gian: "hours dd/mm/yyyy" (ví dụ: "09:00 - 11:00 09/11/2025")
    const timeFormatted = this.formatTimeRange(booking.startTime, booking.endTime);
    this.setFont(doc, 'bold');
    this.addText(doc, `Time:`, margin, yPos);
    this.setFont(doc, 'normal');
    this.addText(doc, timeFormatted, valueX, yPos);
    yPos += 6;
    
    if (booking.checkInTime && booking.checkOutTime) {
      const actualUsageFormatted = this.formatTimeRange(booking.checkInTime, booking.checkOutTime);
      this.setFont(doc, 'bold');
      this.addText(doc, `Actual Usage:`, margin, yPos);
      this.setFont(doc, 'normal');
      this.addText(doc, actualUsageFormatted, valueX, yPos);
      yPos += 6;
    }
    
    const statusLabel = this.getStatusLabel(booking.status || 'pending');
    this.setFont(doc, 'bold');
    this.addText(doc, `Status:`, margin, yPos);
    this.setFont(doc, 'normal');
    this.addText(doc, statusLabel, valueX, yPos);
    yPos += 12;
    
    // ========== BẢNG CHI TIẾT ĐƠN HÀNG ==========
    doc.setFontSize(11);
    this.setFont(doc, 'bold');
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    this.addText(doc, 'Order Details:', margin, yPos);
    yPos += 8;
    
    const basePrice = (booking as any).basePrice || 0;
    const servicesTotal = this.calculateServicesTotal(booking);
    const services = booking.services || [];
    
    // Tính số dòng
    const totalRows = (basePrice > 0 ? 1 : 0) + services.length;
    const rowHeight = 10;
    const headerHeight = 8;
    
    // Vị trí bắt đầu bảng
    const tableStartY = yPos;
    const tableStartX = margin;
    
    // Định nghĩa cột - điều chỉnh để đảm bảo tất cả text nằm trong bảng (tổng = 170mm)
    const colWidths = [18, 80, 20, 26, 26]; // No., Product/Service Name, Qty, Unit Price, Amount
    const colPositions = [tableStartX];
    for (let i = 1; i < colWidths.length; i++) {
      colPositions.push(colPositions[i - 1] + colWidths[i - 1]);
    }
    
    // Header bảng - Background (màu xanh Panacea)
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(tableStartX, tableStartY, contentWidth, headerHeight, 'F');
    
    // Header bảng - Text (màu trắng để đọc được trên nền xanh)
    doc.setFontSize(9);
    this.setFont(doc, 'bold');
    doc.setTextColor(255, 255, 255); // Màu trắng cho text trên nền xanh
    this.addText(doc, 'No.', colPositions[0] + 1, tableStartY + 5.5);
    this.addText(doc, 'Product/Service Name', colPositions[1] + 1, tableStartY + 5.5);
    this.addText(doc, 'Qty', colPositions[2] + colWidths[2] / 2, tableStartY + 5.5, { align: 'center' });
    this.addText(doc, 'Unit Price', colPositions[3] + colWidths[3] - 1, tableStartY + 5.5, { align: 'right' });
    this.addText(doc, 'Amount', colPositions[4] + colWidths[4] - 1, tableStartY + 5.5, { align: 'right' });
    
    // Vẽ border header
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.5);
    doc.line(tableStartX, tableStartY + headerHeight, tableStartX + contentWidth, tableStartY + headerHeight);
    
    let currentRowY = tableStartY + headerHeight;
    let rowIndex = 0;
    
    // Dòng phòng (nếu có)
    if (basePrice > 0) {
      this.drawTableRow(doc, {
        stt: rowIndex + 1,
        name: safeRoomName,
        quantity: 1,
        unitPrice: basePrice,
        total: basePrice,
        rowY: currentRowY,
        colPositions: colPositions,
        colWidths: colWidths,
        isEven: rowIndex % 2 === 0,
        textColor: textDark,
        borderColor: borderGray
      });
      currentRowY += rowHeight;
      rowIndex++;
      
      // Kiểm tra xuống trang nếu cần
      if (currentRowY > 250) {
        doc.addPage();
        currentRowY = 20;
      }
    }
    
    // Dòng dịch vụ
    if (services && services.length > 0) {
      services.forEach((service, index) => {
        // Validate service data
        if (!service || !service.name || service.price === undefined) {
          console.warn('Invalid service data, skipping:', service);
          return;
        }
        
        const quantity = service.quantity || 1;
        const total = service.price * quantity;
        
        this.drawTableRow(doc, {
          stt: rowIndex + 1,
          name: this.removeVietnameseAccents(service.name || 'Service not specified'),
          quantity: quantity,
          unitPrice: service.price || 0,
          total: total,
          rowY: currentRowY,
          colPositions: colPositions,
          colWidths: colWidths,
          isEven: rowIndex % 2 === 0,
          textColor: textDark,
          borderColor: borderGray
        });
        
        currentRowY += rowHeight;
        rowIndex++;
        
        // Xuống trang nếu cần
        if (currentRowY > 250) {
          doc.addPage();
          currentRowY = 20;
        }
      });
    }
    
    // Vẽ border ngoài bảng
    const tableEndY = currentRowY;
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.5);
    // Border trái
    doc.line(tableStartX, tableStartY, tableStartX, tableEndY);
    // Border phải
    doc.line(tableStartX + contentWidth, tableStartY, tableStartX + contentWidth, tableEndY);
    // Border dưới
    doc.line(tableStartX, tableEndY, tableStartX + contentWidth, tableEndY);
    // Border giữa các cột
    for (let i = 1; i < colPositions.length; i++) {
      doc.line(colPositions[i], tableStartY, colPositions[i], tableEndY);
    }
    
    yPos = currentRowY + 12;
    
    // Kiểm tra xem có đủ chỗ cho phần tổng kết không
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    // ========== TÓM TẮT THANH TOÁN ==========
    // Số tiền khách hàng phải thanh toán (totalPrice) đã bao gồm VAT 10%
    // Ví dụ: totalPrice = 1.300.000 VND (đã bao gồm VAT)
    // → Subtotal = 1.300.000 / 1.1 = 1.181.818 VND
    // → VAT 10% = 1.181.818 * 0.1 = 118.182 VND
    // → Total = 1.181.818 + 118.182 = 1.300.000 VND
    
    const discount = booking.discountValue || 0;
    
    // Lấy totalPrice từ booking (đã bao gồm VAT)
    let totalWithVAT = booking.totalPrice;
    if (totalWithVAT === null || totalWithVAT === undefined || isNaN(totalWithVAT)) {
      // Nếu không có totalPrice, tính từ basePrice + servicesTotal - discount
      const rawSubtotal = (basePrice || 0) + (servicesTotal || 0);
      totalWithVAT = rawSubtotal - discount;
    }
    // Đảm bảo total không âm
    totalWithVAT = Math.max(0, totalWithVAT);
    
    // Tính Subtotal (giá trước VAT) từ totalWithVAT
    // Subtotal = Total / 1.1 (vì Total = Subtotal * 1.1)
    const subtotal = Math.round(totalWithVAT / 1.1);
    
    // Tính VAT 10%
    const vatAmount = totalWithVAT - subtotal;
    
    // Box tổng kết (bên phải)
    const summaryX = margin + 60;
    const summaryWidth = contentWidth - 60;
    
    doc.setFontSize(10);
    this.setFont(doc, 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    
    // Subtotal (giá trước VAT)
    this.addText(doc, 'Subtotal:', summaryX, yPos);
    this.addText(doc, this.formatCurrency(subtotal), summaryX + summaryWidth, yPos, { align: 'right' });
    yPos += 7;
    
    this.addText(doc, 'VAT (10%):', summaryX, yPos);
    this.addText(doc, this.formatCurrency(vatAmount), summaryX + summaryWidth, yPos, { align: 'right' });
    yPos += 7;
    
    // Voucher (nếu có)
    if (booking.voucherCode && discount > 0) {
      const voucherCode = this.removeVietnameseAccents(String(booking.voucherCode));
      this.addText(doc, `Voucher (${voucherCode}):`, summaryX, yPos);
      doc.setTextColor(10, 138, 10);
      this.addText(doc, `-${this.formatCurrency(discount)}`, summaryX + summaryWidth, yPos, { align: 'right' });
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      yPos += 7;
    }
    
    // Đường kẻ phân cách
    doc.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.setLineWidth(0.8);
    doc.line(summaryX, yPos, summaryX + summaryWidth, yPos);
    yPos += 8;
    
    // Tổng thanh toán (đã bao gồm VAT)
    doc.setFontSize(12);
    this.setFont(doc, 'bold');
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    this.addText(doc, 'Total Payment:', summaryX, yPos);
    this.addText(doc, this.formatCurrency(totalWithVAT), summaryX + summaryWidth, yPos, { align: 'right' });
    yPos += 8;
    
    // Điểm tích lũy
    if (booking.rewardPointsEarned) {
      doc.setFontSize(9);
      this.setFont(doc, 'normal');
      doc.setTextColor(accentOrange[0], accentOrange[1], accentOrange[2]);
      this.addText(doc, `Reward Points: ${booking.rewardPointsEarned} points`, summaryX, yPos);
    }
    
    // ========== FOOTER ==========
    // Tính toán vị trí footer động dựa trên yPos hiện tại
    let footerY = Math.max(yPos + 20, 270);
    
    // Nếu footer quá gần cuối trang, xuống trang mới
    if (footerY > 280) {
      doc.addPage();
      footerY = 20;
    }
    
    // Đường kẻ phân cách
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY, margin + contentWidth, footerY);
    
    // Lời cảm ơn
    doc.setFontSize(11);
    this.setFont(doc, 'bold');
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    this.addText(doc, 'Thank you for using Panacea services!', pageWidth / 2, footerY + 8, { align: 'center' });
    
    // Thông tin liên hệ
    doc.setFontSize(9);
    this.setFont(doc, 'normal');
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    this.addText(doc, 'Contact us: support@panacea.vn | Hotline: +84 123 456 789', pageWidth / 2, footerY + 15, { align: 'center' });
    
    // Điều khoản
    doc.setFontSize(8);
    this.addText(doc, 'This electronic invoice is legally valid according to Decree 119/2018/ND-CP', pageWidth / 2, footerY + 21, { align: 'center' });
    
    // ========== LƯU FILE ==========
    const fileName = `Invoice-${booking.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  /**
   * Vẽ một dòng trong bảng
   */
  private drawTableRow(
    doc: jsPDF,
    options: {
      stt: number;
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
      rowY: number;
      colPositions: number[];
      colWidths: number[];
      isEven: boolean;
      textColor: [number, number, number];
      borderColor: [number, number, number];
    }
  ): void {
    // Background (alternating)
    if (options.isEven) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(250, 250, 250);
    }
    doc.rect(options.colPositions[0], options.rowY, 
             options.colPositions[options.colPositions.length - 1] + options.colWidths[options.colWidths.length - 1] - options.colPositions[0], 
             10, 'F');
    
    // Text
    doc.setFontSize(9);
    this.setFont(doc, 'normal');
    doc.setTextColor(options.textColor[0], options.textColor[1], options.textColor[2]);
    
    // No.
    this.addText(doc, String(options.stt), options.colPositions[0] + 1, options.rowY + 6.5);
    
    // Product/Service Name (cắt ngắn nếu quá dài để vừa trong cột)
    const maxNameLength = 30;
    const name = options.name.length > maxNameLength 
      ? options.name.substring(0, maxNameLength - 3) + '...' 
      : options.name;
    this.addText(doc, name, options.colPositions[1] + 1, options.rowY + 6.5);
    
    // Quantity
    this.addText(doc, String(options.quantity), options.colPositions[2] + options.colWidths[2] / 2, options.rowY + 6.5, { align: 'center' });
    
    // Unit Price
    this.addText(doc, this.formatCurrency(options.unitPrice), options.colPositions[3] + options.colWidths[3] - 1, options.rowY + 6.5, { align: 'right' });
    
    // Amount
    this.addText(doc, this.formatCurrency(options.total), options.colPositions[4] + options.colWidths[4] - 1, options.rowY + 6.5, { align: 'right' });
    
    // Border dưới
    doc.setDrawColor(options.borderColor[0], options.borderColor[1], options.borderColor[2]);
    doc.setLineWidth(0.3);
    doc.line(options.colPositions[0], options.rowY + 10, 
             options.colPositions[options.colPositions.length - 1] + options.colWidths[options.colWidths.length - 1], 
             options.rowY + 10);
  }

  /**
   * Load font Arial Unicode MS vào jsPDF
   * Note: Cần có font file Base64 hoặc URL
   */
  private loadArialUnicodeFont(doc: jsPDF): void {
    if (this.fontLoaded) {
      return;
    }
    
    try {
      const fontBase64 = 'FONT_BASE64_PLACEHOLDER';
      
      if (fontBase64 && fontBase64 !== 'FONT_BASE64_PLACEHOLDER') {
        doc.addFileToVFS('ArialUnicodeMS.ttf', fontBase64);
        doc.addFont('ArialUnicodeMS.ttf', 'ArialUnicodeMS', 'normal');
        doc.addFont('ArialUnicodeMS.ttf', 'ArialUnicodeMS', 'bold');
        this.fontLoaded = true;
        console.log('Arial Unicode MS font loaded successfully');
      } else {
        // Fallback to helvetica nếu chưa có font
        console.warn('Arial Unicode MS font not provided, using helvetica. See FONT_SETUP.md for instructions.');
        this.fontName = 'helvetica';
        this.fontLoaded = true;
      }
    } catch (error) {
      console.warn('Could not load Arial Unicode MS font, using helvetica:', error);
      this.fontName = 'helvetica';
      this.fontLoaded = true;
    }
  }

  /**
   * Set font với fallback
   */
  private setFont(doc: jsPDF, style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal'): void {
    try {
      if (this.fontName === 'ArialUnicodeMS' && this.fontLoaded) {
        doc.setFont('ArialUnicodeMS', style);
      } else {
        doc.setFont('helvetica', style);
      }
    } catch (error) {
      // Fallback to helvetica
      doc.setFont('helvetica', style);
    }
  }

  /**
   * Helper method để thêm text với xử lý Unicode cho tiếng Việt
   * Note: jsPDF Helvetica font không hỗ trợ đầy đủ tiếng Việt
   * Giải pháp: Sử dụng text trực tiếp với encoding UTF-8
   */
  private addText(doc: jsPDF, text: string, x: number, y: number, options?: { align?: 'left' | 'center' | 'right' }): void {
    try {
      // Đảm bảo text là string và được encode đúng
      // Xử lý null/undefined
      if (text === null || text === undefined) {
        text = '';
      }
      const textStr = String(text);
      
      // Xử lý text rỗng
      if (!textStr || textStr.trim() === '') {
        return;
      }
      
      // Sử dụng splitTextToSize để xử lý text dài
      const maxWidth = 170;
      const lines = doc.splitTextToSize(textStr, maxWidth);
      
      // Validate lines
      if (!lines || lines.length === 0) {
        return;
      }
      
      // Render text với options
      if (options?.align === 'center') {
        doc.text(lines, x, y, { align: 'center' });
      } else if (options?.align === 'right') {
        doc.text(lines, x, y, { align: 'right' });
      } else {
        doc.text(lines, x, y);
      }
    } catch (error) {
      // Fallback: render text trực tiếp nếu có lỗi
      console.warn('Error rendering text:', error, 'Text:', text);
      try {
        const safeText = String(text || '');
        if (options?.align === 'center') {
          doc.text(safeText, x, y, { align: 'center' });
        } else if (options?.align === 'right') {
          doc.text(safeText, x, y, { align: 'right' });
        } else {
          doc.text(safeText, x, y);
        }
      } catch (fallbackError) {
        console.error('Fallback text rendering also failed:', fallbackError);
      }
    }
  }

  /**
   * Tính tổng giá dịch vụ
   */
  private calculateServicesTotal(booking: Booking): number {
    if (!booking.services || booking.services.length === 0) {
      return 0;
    }
    return booking.services.reduce((total, service) => {
      // Validate service data
      if (!service || service.price === null || service.price === undefined || isNaN(service.price)) {
        return total;
      }
      const quantity = service.quantity || 1;
      const price = Number(service.price) || 0;
      return total + (price * quantity);
    }, 0);
  }

  /**
   * Format tiền tệ - thay ₫ bằng VND
   */
  private formatCurrency(value: number): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0 VND';
    }
    return new Intl.NumberFormat('vi-VN').format(value) + ' VND';
  }

  /**
   * Chuyển đổi tiếng Việt có dấu sang không dấu
   * Để tránh lỗi font khi in PDF
   */
  private removeVietnameseAccents(str: string): string {
    if (!str) return '';
    
    const strValue = String(str);
    
    // Map các ký tự có dấu sang không dấu
    const accentMap: { [key: string]: string } = {
      'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
      'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
      'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
      'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
      'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
      'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
      'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
      'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
      'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
      'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
      'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
      'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
      'đ': 'd',
      'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A',
      'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A',
      'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
      'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E',
      'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
      'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
      'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O',
      'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O',
      'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
      'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U',
      'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
      'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
      'Đ': 'D'
    };
    
    return strValue.split('').map(char => accentMap[char] || char).join('');
  }

  /**
   * Format thời gian từ "mm:hh dd/MM/yyyy" thành "hours dd/mm/yyyy"
   * Ví dụ: "09:00 09/11/2025" và "11:00 09/11/2025" → "09:00 - 11:00 09/11/2025"
   */
  private formatTimeRange(startTime: string, endTime: string): string {
    if (!startTime || !endTime) {
      return 'N/A';
    }
    
    try {
      // Parse startTime: "09:00 09/11/2025"
      const startParts = startTime.trim().split(' ');
      const startHour = startParts[0] || '';
      const startDate = startParts[1] || '';
      
      // Parse endTime: "11:00 09/11/2025"
      const endParts = endTime.trim().split(' ');
      const endHour = endParts[0] || '';
      const endDate = endParts[1] || '';
      
      // Sử dụng ngày từ startTime (hoặc endTime nếu startTime không có ngày)
      const date = startDate || endDate;
      
      if (startHour && endHour && date) {
        return `${startHour} - ${endHour} ${date}`;
      } else if (startHour && endHour) {
        return `${startHour} - ${endHour}`;
      } else {
        return `${startTime} to ${endTime}`;
      }
    } catch (error) {
      // Fallback nếu có lỗi parse
      return `${startTime} to ${endTime}`;
    }
  }

  /**
   * Lấy label trạng thái
   */
  private getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'no-show': 'Không đến'
    };
    return labels[status] || status;
  }
}
