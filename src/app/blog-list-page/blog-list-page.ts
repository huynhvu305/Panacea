import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SEOService } from '../services/seo.service';

interface PanaceaArticle {
  icon: string; // Bootstrap Icon class (e.g., 'bi bi-calendar-check')
  title: string;
  shortDescription: string;
  readMoreLink: string;
  fullContent: string; // Nội dung đầy đủ của bài blog
}

@Component({
  selector: 'app-blog-list-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-list-page.html',
  styleUrls: ['./blog-list-page.css'],
})
export class BlogListPage implements OnInit {
  selectedArticle: PanaceaArticle | null = null;
  showModal = false;

  constructor(
    private sanitizer: DomSanitizer,
    private seoService: SEOService
  ) {}

  ngOnInit(): void {
    this.seoService.updateSEO({
      title: 'Cẩm Nang Panacea - Thông tin hay cần biết',
      description: 'Cẩm nang đầy đủ về Panacea - Hướng dẫn đặt phòng, chính sách hủy đổi, thanh toán, ưu đãi và các thông tin hữu ích khác.',
      keywords: 'Cẩm nang Panacea, hướng dẫn đặt phòng, chính sách Panacea, thanh toán Panacea, ưu đãi Panacea',
      image: '/assets/images/BACKGROUND.webp'
    });
  }

  getSafeHtml(content: string | undefined): SafeHtml {
    if (!content) return '';
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  // Featured articles - Thông tin hay cần biết
  featuredArticles: PanaceaArticle[] = [
    {
      icon: 'bi bi-question-circle',
      title: 'Những câu hỏi thường gặp khi đặt phòng',
      shortDescription: 'Giải đáp các thắc mắc phổ biến về quy trình đặt phòng, thanh toán, hủy đổi và các dịch vụ tại Panacea.',
      readMoreLink: '/blog/faq',
      fullContent: `
        <h4 class="mb-4">Những câu hỏi thường gặp khi đặt phòng</h4>
        <p class="lead">Chúng tôi đã tổng hợp các câu hỏi thường gặp nhất để giúp bạn có trải nghiệm đặt phòng suôn sẻ tại Panacea.</p>
        
        <h5 class="mt-4 mb-3">1. Tôi có thể đặt phòng trực tiếp tại cơ sở không?</h5>
        <p>Có, bạn có thể đến trực tiếp tại Panacea để đặt phòng. Tuy nhiên, để đảm bảo có chỗ, chúng tôi khuyến khích đặt trước qua website hoặc hotline <strong>1900 123 456</strong>.</p>
        
        <h5 class="mt-4 mb-3">2. Có cần đặt cọc khi đặt phòng không?</h5>
        <p>Để giữ chỗ, bạn cần thanh toán toàn bộ số tiền khi đặt phòng. Nếu hủy đúng chính sách, bạn sẽ được hoàn tiền theo quy định.</p>
        
        <h5 class="mt-4 mb-3">3. Tôi có thể đổi phòng sau khi đã đặt không?</h5>
        <p>Có, bạn có thể đổi phòng miễn phí nếu thông báo trước ít nhất 12 giờ. Vui lòng liên hệ hotline hoặc vào mục "Đặt phòng của tôi" trên website.</p>
        
        <h5 class="mt-4 mb-3">4. Panacea có dịch vụ cho trẻ em không?</h5>
        <p>Một số dịch vụ phù hợp với trẻ em từ 12 tuổi trở lên. Trẻ em dưới 12 tuổi cần có người lớn đi kèm. Vui lòng liên hệ để được tư vấn dịch vụ phù hợp.</p>
        
        <h5 class="mt-4 mb-3">5. Tôi có thể sử dụng Panacea Points để thanh toán không?</h5>
        <p>Có, bạn có thể sử dụng Panacea Points để giảm giá hoặc thanh toán một phần. 100 điểm = 10.000 VNĐ. Bạn có thể kết hợp điểm với các phương thức thanh toán khác.</p>
        
        <h5 class="mt-4 mb-3">6. Có chỗ đậu xe không?</h5>
        <p>Có, Panacea có bãi đậu xe miễn phí cho khách hàng. Bãi đậu xe nằm ngay trong khuôn viên, rất tiện lợi.</p>
        
        <div class="alert alert-info mt-4">
          <i class="bi bi-telephone me-2"></i>
          <strong>Cần hỗ trợ thêm?</strong> Liên hệ hotline <strong>1900 123 456</strong> hoặc email <strong>hello@panacea.vn</strong> để được tư vấn.
        </div>
      `
    },
    {
      icon: 'bi bi-shield-check',
      title: 'An toàn và bảo mật thông tin',
      shortDescription: 'Cam kết về an toàn, bảo mật thông tin cá nhân và các biện pháp đảm bảo an toàn khi sử dụng dịch vụ tại Panacea.',
      readMoreLink: '/blog/safety',
      fullContent: `
        <h4 class="mb-4">An toàn và bảo mật thông tin</h4>
        <p class="lead">Panacea cam kết đảm bảo an toàn tuyệt đối cho khách hàng cả về thể chất và thông tin cá nhân.</p>
        
        <h5 class="mt-4 mb-3">Bảo mật thông tin cá nhân</h5>
        <ul>
          <li><strong>Mã hóa dữ liệu:</strong> Tất cả thông tin thanh toán và cá nhân được mã hóa SSL/TLS</li>
          <li><strong>Không chia sẻ:</strong> Chúng tôi không bán hoặc chia sẻ thông tin của bạn cho bên thứ ba</li>
          <li><strong>Tuân thủ GDPR:</strong> Tuân thủ đầy đủ các quy định về bảo vệ dữ liệu cá nhân</li>
          <li><strong>Quyền riêng tư:</strong> Bạn có thể yêu cầu xóa hoặc chỉnh sửa thông tin bất cứ lúc nào</li>
        </ul>
        
        <h5 class="mt-4 mb-3">An toàn khi sử dụng dịch vụ</h5>
        <ul>
          <li><strong>Thiết bị an toàn:</strong> Tất cả thiết bị và dụng cụ được kiểm tra định kỳ</li>
          <li><strong>Đồ bảo hộ:</strong> Cung cấp đầy đủ đồ bảo hộ cho các hoạt động có rủi ro</li>
          <li><strong>Nhân viên được đào tạo:</strong> Tất cả nhân viên được đào tạo về an toàn và sơ cứu</li>
          <li><strong>Bảo hiểm:</strong> Panacea có bảo hiểm trách nhiệm dân sự đầy đủ</li>
        </ul>
        
        <h5 class="mt-4 mb-3">An toàn vệ sinh</h5>
        <ul>
          <li>Vệ sinh và khử trùng phòng sau mỗi lần sử dụng</li>
          <li>Dụng cụ được khử trùng theo tiêu chuẩn y tế</li>
          <li>Không gian thông thoáng, đảm bảo không khí trong lành</li>
          <li>Nhân viên tuân thủ nghiêm ngặt quy trình vệ sinh</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Báo cáo sự cố</h5>
        <p>Nếu bạn gặp bất kỳ vấn đề nào về an toàn hoặc bảo mật, vui lòng:</p>
        <ol>
          <li>Báo ngay cho nhân viên tại cơ sở</li>
          <li>Liên hệ hotline <strong>1900 123 456</strong></li>
          <li>Gửi email đến <strong>safety@panacea.vn</strong></li>
        </ol>
        
        <div class="alert alert-success mt-4">
          <i class="bi bi-shield-check me-2"></i>
          <strong>Cam kết:</strong> An toàn và bảo mật của khách hàng là ưu tiên hàng đầu của Panacea.
        </div>
      `
    },
    {
      icon: 'bi bi-people',
      title: 'Quy tắc ứng xử và văn hóa Panacea',
      shortDescription: 'Hướng dẫn về quy tắc ứng xử, văn hóa và các nguyên tắc khi tham gia các hoạt động tại Panacea để có trải nghiệm tốt nhất.',
      readMoreLink: '/blog/etiquette',
      fullContent: `
        <h4 class="mb-4">Quy tắc ứng xử và văn hóa Panacea</h4>
        <p class="lead">Panacea là không gian chữa lành và thư giãn. Chúng tôi mong muốn tạo ra môi trường tôn trọng, hòa hợp cho tất cả mọi người.</p>
        
        <h5 class="mt-4 mb-3">Nguyên tắc cơ bản</h5>
        <ul>
          <li><strong>Tôn trọng:</strong> Tôn trọng không gian, thời gian và sự riêng tư của người khác</li>
          <li><strong>Yên tĩnh:</strong> Giữ im lặng trong các khu vực thiền định và trị liệu</li>
          <li><strong>Đúng giờ:</strong> Đến đúng giờ đã đặt, không làm ảnh hưởng đến lịch của người khác</li>
          <li><strong>Vệ sinh:</strong> Giữ gìn vệ sinh chung, trả lại dụng cụ về đúng vị trí</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Quy tắc theo khu vực</h5>
        
        <h6 class="mt-3 mb-2"><strong>Catharsis - Vườn An Nhiên:</strong></h6>
        <ul>
          <li>Tắt điện thoại hoặc để chế độ im lặng</li>
          <li>Mặc trang phục thoải mái, phù hợp với hoạt động</li>
          <li>Không mang đồ ăn, thức uống vào phòng thiền/yoga</li>
          <li>Tuân thủ hướng dẫn của giáo viên</li>
        </ul>
        
        <h6 class="mt-3 mb-2"><strong>Oasis - Vườn Tâm Hồn:</strong></h6>
        <ul>
          <li>Giữ bí mật về nội dung tư vấn</li>
          <li>Không làm phiền người khác đang trong phòng tư vấn</li>
          <li>Đến đúng giờ hẹn, không đến sớm quá 15 phút</li>
        </ul>
        
        <h6 class="mt-3 mb-2"><strong>Genii - Vườn Cảm Hứng:</strong></h6>
        <ul>
          <li>Chia sẻ không gian sáng tạo một cách công bằng</li>
          <li>Bảo quản dụng cụ nghệ thuật cẩn thận</li>
          <li>Tôn trọng tác phẩm của người khác</li>
        </ul>
        
        <h6 class="mt-3 mb-2"><strong>Mutiny - Vườn Cách Mạng:</strong></h6>
        <ul>
          <li>Mặc đầy đủ đồ bảo hộ theo hướng dẫn</li>
          <li>Chỉ sử dụng dụng cụ được cung cấp</li>
          <li>Không làm ảnh hưởng đến người khác đang sử dụng</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Những điều không nên làm</h5>
        <ul>
          <li>Không hút thuốc trong toàn bộ khuôn viên</li>
          <li>Không sử dụng chất kích thích</li>
          <li>Không quay phim, chụp ảnh người khác mà không được phép</li>
          <li>Không mang theo vật nuôi (trừ thú cưng hỗ trợ được chứng nhận)</li>
          <li>Không làm ồn, nói chuyện lớn tiếng</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Văn hóa Panacea</h5>
        <p>Panacea tin rằng mỗi người đều xứng đáng có không gian riêng để chữa lành và phát triển. Chúng tôi khuyến khích:</p>
        <ul>
          <li>Chia sẻ tích cực và hỗ trợ lẫn nhau</li>
          <li>Giữ tinh thần cởi mở và tôn trọng sự khác biệt</li>
          <li>Đóng góp ý kiến xây dựng để cải thiện dịch vụ</li>
        </ul>
        
        <div class="alert alert-warning mt-4">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <strong>Lưu ý:</strong> Vi phạm quy tắc ứng xử có thể dẫn đến việc từ chối phục vụ hoặc cấm vĩnh viễn.
        </div>
      `
    }
  ];

  // Regular articles
  regularArticles: PanaceaArticle[] = [
    {
      icon: 'bi bi-calendar-check',
      title: 'Hướng dẫn đặt phòng tại Panacea',
      shortDescription: 'Tìm hiểu các bước chi tiết để đặt phòng tại Panacea một cách dễ dàng và nhanh chóng nhất.',
      readMoreLink: '/detail-travel-guide',
      fullContent: `
        <h4 class="mb-4">Hướng dẫn đặt phòng tại Panacea</h4>
        <p class="lead">Đặt phòng tại Panacea rất đơn giản và nhanh chóng. Chỉ cần vài bước, bạn đã có thể sở hữu một trải nghiệm tuyệt vời.</p>
        
        <h5 class="mt-4 mb-3">Bước 1: Chọn khu vực và dịch vụ</h5>
        <p>Truy cập trang đặt phòng và chọn một trong 4 khu vực của Panacea:</p>
        <ul>
          <li><strong>Catharsis - Vườn An Nhiên:</strong> Yoga, Thiền định, Massage trị liệu, Phòng xông hơi thảo dược</li>
          <li><strong>Oasis - Vườn Tâm Hồn:</strong> Tư vấn tâm lý, Viết nhật ký trị liệu, Phòng lắng nghe</li>
          <li><strong>Genii - Vườn Cảm Hứng:</strong> Vẽ tranh, Nghệ thuật thủ công, Âm nhạc trị liệu</li>
          <li><strong>Mutiny - Vườn Cách Mạng:</strong> Phòng đập phá an toàn, Bắn cung, Trò chơi vận động</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Bước 2: Chọn thời gian</h5>
        <p>Chọn ngày và khung giờ phù hợp với lịch trình của bạn. Hệ thống sẽ hiển thị các slot còn trống.</p>
        
        <h5 class="mt-4 mb-3">Bước 3: Xác nhận và thanh toán</h5>
        <p>Kiểm tra lại thông tin đặt phòng, chọn phương thức thanh toán và hoàn tất đặt phòng. Bạn sẽ nhận được email xác nhận ngay sau đó.</p>
        
        <div class="alert alert-info mt-4">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Lưu ý:</strong> Nên đặt phòng trước 1-2 ngày, đặc biệt vào cuối tuần để đảm bảo có chỗ.
        </div>
      `
    },
    {
      icon: 'bi bi-arrow-left-right',
      title: 'Chính sách hủy và đổi ngày',
      shortDescription: 'Thông tin về chính sách hủy phòng, đổi ngày và các điều khoản liên quan khi đặt phòng tại Panacea.',
      readMoreLink: '/detail-travel-guide',
      fullContent: `
        <h4 class="mb-4">Chính sách hủy và đổi ngày</h4>
        <p class="lead">Panacea hiểu rằng đôi khi bạn cần thay đổi kế hoạch. Chúng tôi có chính sách linh hoạt để hỗ trợ bạn.</p>
        
        <h5 class="mt-4 mb-3">Đổi ngày</h5>
        <p>Bạn có thể đổi ngày đặt phòng miễn phí nếu thông báo trước <strong>ít nhất 12 giờ</strong> so với thời gian đã đặt. Chỉ cần vào mục "Đặt phòng của tôi" và chọn "Đổi ngày".</p>
        
        <h5 class="mt-4 mb-3">Hủy phòng và hoàn tiền</h5>
        <ul>
          <li><strong>Hủy trước 12 giờ:</strong> Hoàn 100% số tiền đã thanh toán</li>
          <li><strong>Hủy trước 6-12 giờ:</strong> Hoàn 50% số tiền đã thanh toán</li>
          <li><strong>Hủy dưới 6 giờ:</strong> Không hoàn tiền</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Quy trình hủy/đổi</h5>
        <ol>
          <li>Đăng nhập vào tài khoản của bạn</li>
          <li>Vào mục "Đặt phòng của tôi"</li>
          <li>Chọn đặt phòng cần hủy/đổi</li>
          <li>Chọn "Hủy phòng" hoặc "Đổi ngày"</li>
          <li>Xác nhận thao tác</li>
        </ol>
        
        <div class="alert alert-warning mt-4">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <strong>Lưu ý:</strong> Tiền hoàn lại sẽ được chuyển về tài khoản trong vòng 3-5 ngày làm việc.
        </div>
      `
    },
    {
      icon: 'bi bi-house-door',
      title: 'Các loại phòng và tiện ích',
      shortDescription: 'Khám phá các loại phòng đa dạng tại Panacea cùng với các tiện ích và dịch vụ đi kèm.',
      readMoreLink: '/detail-travel-guide',
      fullContent: `
        <h4 class="mb-4">Các loại phòng và tiện ích</h4>
        <p class="lead">Panacea cung cấp 4 khu vực độc đáo, mỗi khu vực mang đến những trải nghiệm riêng biệt.</p>
        
        <h5 class="mt-4 mb-3">Catharsis - Vườn An Nhiên</h5>
        <p>Dành cho những ai muốn tìm lại sự bình yên và cân bằng:</p>
        <ul>
          <li>Phòng Yoga (Hatha, Vinyasa, Yin)</li>
          <li>Phòng Thiền định với không gian yên tĩnh</li>
          <li>Phòng Massage trị liệu chuyên nghiệp</li>
          <li>Phòng xông hơi thảo dược tự nhiên</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Oasis - Vườn Tâm Hồn</h5>
        <p>Không gian hỗ trợ tâm lý và cảm xúc:</p>
        <ul>
          <li>Phòng tư vấn tâm lý 1-1 riêng tư</li>
          <li>Không gian viết nhật ký trị liệu</li>
          <li>Phòng lắng nghe với âm thanh trị liệu</li>
          <li>Workshop quản lý cảm xúc</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Genii - Vườn Cảm Hứng</h5>
        <p>Nơi sáng tạo không giới hạn:</p>
        <ul>
          <li>Studio vẽ tranh tự do</li>
          <li>Không gian nghệ thuật thủ công</li>
          <li>Phòng âm nhạc trị liệu</li>
          <li>Workshop sáng tạo nhóm</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Mutiny - Vườn Cách Mạng</h5>
        <p>Giải tỏa căng thẳng một cách an toàn:</p>
        <ul>
          <li>Phòng đập phá an toàn với đồ bảo hộ</li>
          <li>Sân bắn cung chuyên nghiệp</li>
          <li>Khu vực trò chơi vận động</li>
        </ul>
        
        <div class="alert alert-success mt-4">
          <i class="bi bi-check-circle me-2"></i>
          <strong>Tất cả phòng đều được trang bị đầy đủ dụng cụ và thiết bị cần thiết.</strong>
        </div>
      `
    },
    {
      icon: 'bi bi-credit-card',
      title: 'Thanh toán và ưu đãi đặc biệt',
      shortDescription: 'Tìm hiểu các phương thức thanh toán và các chương trình ưu đãi, khuyến mãi hấp dẫn.',
      readMoreLink: '/detail-travel-guide',
      fullContent: `
        <h4 class="mb-4">Thanh toán và ưu đãi đặc biệt</h4>
        <p class="lead">Panacea cung cấp nhiều phương thức thanh toán tiện lợi và các chương trình ưu đãi hấp dẫn.</p>
        
        <h5 class="mt-4 mb-3">Phương thức thanh toán</h5>
        <ul>
          <li><strong>Thẻ tín dụng/ghi nợ:</strong> Visa, Mastercard, JCB</li>
          <li><strong>Ví điện tử:</strong> MoMo, ZaloPay, VNPay</li>
          <li><strong>Chuyển khoản ngân hàng:</strong> Tất cả các ngân hàng tại Việt Nam</li>
          <li><strong>Panacea Points:</strong> Sử dụng điểm tích lũy để thanh toán</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Panacea Points - Chương trình tích điểm</h5>
        <p>Bạn sẽ nhận được điểm khi:</p>
        <ul>
          <li>Đánh giá dịch vụ sau khi sử dụng: <strong>50 điểm</strong></li>
          <li>Đặt phòng thường xuyên: <strong>100 điểm/lần</strong></li>
          <li>Giới thiệu bạn bè: <strong>200 điểm/người</strong></li>
        </ul>
        <p><strong>Quy đổi:</strong> 100 điểm = 10.000 VNĐ. Điểm có thể dùng để giảm giá hoặc thanh toán trực tiếp.</p>
        
        <h5 class="mt-4 mb-3">Ưu đãi đặc biệt</h5>
        <ul>
          <li><strong>Combo 3 buổi:</strong> Giảm 15% khi đặt 3 buổi cùng lúc</li>
          <li><strong>Thành viên mới:</strong> Giảm 20% cho lần đặt đầu tiên</li>
          <li><strong>Ngày sinh nhật:</strong> Tặng 1 buổi miễn phí trong tháng sinh nhật</li>
          <li><strong>Nhóm 5 người trở lên:</strong> Giảm 10% cho toàn bộ nhóm</li>
        </ul>
        
        <div class="alert alert-primary mt-4">
          <i class="bi bi-gift me-2"></i>
          <strong>Mẹo:</strong> Theo dõi fanpage và email để nhận thông báo về các chương trình khuyến mãi đặc biệt!
        </div>
      `
    },
    {
      icon: 'bi bi-clock-history',
      title: 'Quy định check-in và check-out',
      shortDescription: 'Thông tin về thời gian check-in, check-out và các quy định cần lưu ý khi lưu trú tại Panacea.',
      readMoreLink: '/detail-travel-guide',
      fullContent: `
        <h4 class="mb-4">Quy định check-in và check-out</h4>
        <p class="lead">Để đảm bảo trải nghiệm tốt nhất cho tất cả khách hàng, vui lòng tuân thủ các quy định sau.</p>
        
        <h5 class="mt-4 mb-3">Giờ hoạt động</h5>
        <p><strong>Panacea hoạt động từ 8:00 - 20:00</strong> tất cả các ngày trong tuần, kể cả thứ 7 và Chủ nhật.</p>
        
        <h5 class="mt-4 mb-3">Check-in</h5>
        <ul>
          <li><strong>Thời gian:</strong> Vui lòng đến trước 10 phút so với giờ đặt phòng</li>
          <li><strong>Thủ tục:</strong> Xuất trình email xác nhận hoặc mã đặt phòng tại quầy lễ tân</li>
          <li><strong>Đồ dùng cá nhân:</strong> Một số dịch vụ yêu cầu mang theo đồ dùng riêng (sẽ được thông báo trước)</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Trong quá trình sử dụng</h5>
        <ul>
          <li>Tuân thủ hướng dẫn của nhân viên và chuyên gia</li>
          <li>Giữ gìn vệ sinh chung, không làm ồn ảnh hưởng đến người khác</li>
          <li>Sử dụng thiết bị và dụng cụ đúng cách</li>
          <li>Không mang đồ ăn, thức uống vào một số khu vực đặc biệt</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Check-out</h5>
        <ul>
          <li><strong>Thời gian:</strong> Kết thúc đúng giờ đã đặt, không được kéo dài quá 10 phút</li>
          <li><strong>Trả lại dụng cụ:</strong> Vui lòng trả lại tất cả dụng cụ đã mượn về đúng vị trí</li>
          <li><strong>Đánh giá:</strong> Chúng tôi rất mong nhận được phản hồi của bạn để cải thiện dịch vụ</li>
        </ul>
        
        <h5 class="mt-4 mb-3">Quy định đặc biệt</h5>
        <ul>
          <li>Trẻ em dưới 12 tuổi cần có người lớn đi kèm</li>
          <li>Một số dịch vụ yêu cầu sức khỏe tốt (sẽ được tư vấn trước)</li>
          <li>Không được mang theo vật nuôi</li>
        </ul>
        
        <div class="alert alert-info mt-4">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Lưu ý:</strong> Nếu bạn đến muộn, thời gian sử dụng sẽ bị rút ngắn tương ứng. Vui lòng đến đúng giờ!
        </div>
      `
    },
    {
      icon: 'bi bi-star-fill',
      title: 'Các khách hàng nói gì về Panacea',
      shortDescription: 'Lắng nghe cảm nhận và chia sẻ thực tế từ những khách hàng đã trải nghiệm tại Panacea Resort.',
      readMoreLink: '/detail-travel-guide',
      fullContent: `
        <h4 class="mb-4">Các khách hàng nói gì về Panacea</h4>
        <p class="lead">Hơn 10.000 khách hàng đã tin tưởng và trải nghiệm dịch vụ của Panacea. Dưới đây là một số chia sẻ từ họ.</p>
        
        <div class="testimonial-card p-4 mb-4 bg-light rounded">
          <div class="d-flex align-items-center mb-3">
            <div class="testimonial-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
              <strong>LN</strong>
            </div>
            <div>
              <strong>Lan Nguyễn</strong>
              <div class="text-warning">
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
              </div>
            </div>
          </div>
          <p class="mb-0">"Tôi đã thử lớp Yoga tại Catharsis và thực sự ấn tượng. Không gian rất yên tĩnh, giáo viên chuyên nghiệp. Sau buổi học, tôi cảm thấy thư giãn hoàn toàn. Sẽ quay lại!"</p>
        </div>
        
        <div class="testimonial-card p-4 mb-4 bg-light rounded">
          <div class="d-flex align-items-center mb-3">
            <div class="testimonial-avatar bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
              <strong>MT</strong>
            </div>
            <div>
              <strong>Minh Trần</strong>
              <div class="text-warning">
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
              </div>
            </div>
          </div>
          <p class="mb-0">"Mutiny thực sự là nơi giải tỏa stress tuyệt vời! Phòng đập phá rất an toàn với đầy đủ đồ bảo hộ. Sau khi thử, tôi cảm thấy nhẹ nhõm hơn rất nhiều. Rất đáng để thử!"</p>
        </div>
        
        <div class="testimonial-card p-4 mb-4 bg-light rounded">
          <div class="d-flex align-items-center mb-3">
            <div class="testimonial-avatar bg-warning text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
              <strong>HT</strong>
            </div>
            <div>
              <strong>Hương Trần</strong>
              <div class="text-warning">
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-half"></i>
              </div>
            </div>
          </div>
          <p class="mb-0">"Tư vấn tâm lý tại Oasis rất chuyên nghiệp. Chuyên gia lắng nghe và đưa ra lời khuyên rất hữu ích. Không gian riêng tư, thoải mái. Tôi đã đặt thêm 3 buổi nữa."</p>
        </div>
        
        <div class="testimonial-card p-4 mb-4 bg-light rounded">
          <div class="d-flex align-items-center mb-3">
            <div class="testimonial-avatar bg-danger text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
              <strong>DK</strong>
            </div>
            <div>
              <strong>Đức Khang</strong>
              <div class="text-warning">
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
              </div>
            </div>
          </div>
          <p class="mb-0">"Workshop vẽ tranh tại Genii thật sự thú vị! Tôi không biết vẽ nhưng được hướng dẫn rất tận tình. Kết quả là một bức tranh đẹp mà tôi tự hào. Cảm ơn Panacea!"</p>
        </div>
        
        <div class="alert alert-success mt-4">
          <i class="bi bi-heart-fill me-2"></i>
          <strong>Đánh giá trung bình:</strong> 4.8/5 sao từ hơn 2.500 đánh giá
        </div>
      `
    }
  ];

  openModal(article: PanaceaArticle) {
    this.selectedArticle = article;
    this.showModal = true;
    // Ngăn scroll body khi modal mở
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.showModal = false;
    this.selectedArticle = null;
    // Khôi phục scroll body
    document.body.style.overflow = 'auto';
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event) {
    if (this.showModal) {
      this.closeModal();
    }
  }
}