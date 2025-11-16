import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { CreateTicketDto, FAQ, Ticket } from '../interfaces/support';

@Injectable({ providedIn: 'root' })
export class SupportService {
  // Dữ liệu FAQs hardcode
  private readonly faqsData: FAQ[] = [
    {
      question: 'Cách đặt phòng tại Panacea?',
      answer: 'Bạn có thể đặt phòng trực tuyến trên website Panacea. Chọn khu vực (Catharsis, Oasis, Genii, hoặc Mutiny), chọn dịch vụ và khung giờ phù hợp, sau đó xác nhận và thanh toán.',
      category: 'Đặt phòng'
    },
    {
      question: 'Có thể đổi hoặc hủy lịch đặt phòng không?',
      answer: 'Bạn có thể đổi hoặc hủy lịch trước 12 giờ so với thời gian đặt. Vào mục "Đặt phòng của tôi", chọn đơn cần thay đổi và làm theo hướng dẫn. Hệ thống sẽ tự động kiểm tra slot mới khả dụng.',
      category: 'Đặt phòng'
    },
    {
      question: 'Panacea có những khu vực nào?',
      answer: 'Panacea có 4 khu vực: 🌿 Catharsis (Vườn An Nhiên) - Yoga, thiền, massage; 💧 Oasis (Vườn Tâm Hồn) - Tư vấn tâm lý, viết nhật ký; 🎨 Genii (Vườn Cảm Hứng) - Nghệ thuật, âm nhạc, vẽ tranh; 🔥 Mutiny (Vườn Cách Mạng) - Trò chơi vận động, đập phá an toàn, bắn cung.',
      category: 'Thông tin chung'
    },
    {
      question: 'Làm thế nào để tích điểm Panacea Points?',
      answer: 'Bạn sẽ nhận được điểm thưởng khi đánh giá dịch vụ, đặt phòng thường xuyên, và tham gia các chương trình khuyến mãi. Điểm có thể dùng để giảm giá cho các lần đặt tiếp theo.',
      category: 'Panacea Points'
    },
    {
      question: 'Thanh toán thất bại hoặc bị trừ tiền 2 lần',
      answer: 'Kiểm tra hạn mức thẻ, đường truyền. Nếu bị trừ 2 lần, vui lòng gửi yêu cầu hỗ trợ để chúng tôi xử lý hoàn tiền trong vòng 3-5 ngày làm việc.',
      category: 'Thanh toán'
    },
    {
      question: 'Làm thế nào để đăng nhập an toàn?',
      answer: 'Kích hoạt xác thực 2 lớp trong cài đặt tài khoản, không chia sẻ mật khẩu và mã OTP cho người lạ. Luôn đăng xuất khi sử dụng máy tính công cộng.',
      category: 'Tài khoản'
    },
    {
      question: 'Không nhận được email xác nhận đặt phòng',
      answer: 'Kiểm tra hộp thư rác hoặc thư mục spam. Nếu vẫn không có, vào mục "Đặt phòng của tôi" trên website để xem trạng thái đặt phòng. Bạn cũng có thể liên hệ hotline để được hỗ trợ.',
      category: 'Đặt phòng'
    },
    {
      question: 'Có cần đặt trước không hay có thể đến trực tiếp?',
      answer: 'Panacea chỉ phục vụ khách đã đặt phòng trước qua website, không phục vụ khách vãng lai. Vui lòng đặt trước ít nhất 2 giờ để đảm bảo có slot trống.',
      category: 'Thông tin chung'
    },
    {
      question: 'Có thể đặt nhiều dịch vụ trong một lần không?',
      answer: 'Có, một đơn đặt có thể chứa nhiều dịch vụ khác nhau, nhưng không được trùng khung giờ. Hệ thống sẽ tự động kiểm tra và cảnh báo nếu có xung đột thời gian.',
      category: 'Đặt phòng'
    },
    {
      question: 'Độ tuổi nào có thể sử dụng dịch vụ Panacea?',
      answer: 'Một số khu vực như Mutiny (đập phá, bắn cung) yêu cầu từ 16 tuổi trở lên. Các khu vực khác như Catharsis, Oasis, Genii phù hợp với mọi lứa tuổi. Trẻ em dưới 12 tuổi cần có người lớn đi kèm.',
      category: 'Thông tin chung'
    },
    {
      question: 'Catharsis - Vườn An Nhiên có những dịch vụ gì?',
      answer: 'Catharsis cung cấp các dịch vụ thư giãn và chữa lành: Yoga (Hatha, Vinyasa, Yin), Thiền định (Mindfulness, Guided Meditation), Massage trị liệu (Thái, Shiatsu, Aromatherapy), và Phòng xông hơi thảo dược. Mỗi buổi kéo dài 60-90 phút, phù hợp cho người muốn giảm stress và cân bằng năng lượng.',
      category: 'Catharsis'
    },
    {
      question: 'Tôi chưa từng tập Yoga, có thể tham gia tại Catharsis không?',
      answer: 'Hoàn toàn có thể! Catharsis có các lớp Yoga cho người mới bắt đầu với hướng dẫn chi tiết từ giáo viên chuyên nghiệp. Bạn sẽ được hướng dẫn từng động tác cơ bản, không cần lo lắng về độ khó. Chúng tôi khuyến khích bạn đặt lớp "Yoga Cơ Bản" hoặc "Yoga Nhẹ Nhàng" cho lần đầu.',
      category: 'Catharsis'
    },
    {
      question: 'Oasis - Vườn Tâm Hồn phù hợp cho ai?',
      answer: 'Oasis dành cho những ai đang trải qua khó khăn tâm lý, cần lắng nghe và chia sẻ. Dịch vụ bao gồm: Tư vấn tâm lý 1-1 với chuyên gia, Viết nhật ký trị liệu, Phòng lắng nghe (listening room), và Workshop quản lý cảm xúc. Phù hợp cho học sinh, sinh viên, nhân viên văn phòng đang stress hoặc cần hỗ trợ tâm lý.',
      category: 'Oasis'
    },
    {
      question: 'Tư vấn tâm lý tại Oasis có bảo mật không?',
      answer: 'Tuyệt đối bảo mật! Tất cả thông tin trao đổi giữa bạn và chuyên gia tâm lý được bảo mật nghiêm ngặt theo quy định. Chúng tôi cam kết không tiết lộ thông tin cá nhân hay nội dung tư vấn cho bất kỳ bên thứ ba nào. Phòng tư vấn được thiết kế riêng tư, cách âm tốt để đảm bảo không gian an toàn.',
      category: 'Oasis'
    },
    {
      question: 'Genii - Vườn Cảm Hứng có cần biết vẽ không?',
      answer: 'Không cần! Genii dành cho mọi người, kể cả người chưa từng cầm cọ vẽ. Chúng tôi có các workshop "Vẽ Tranh Tự Do" nơi bạn có thể thỏa sức sáng tạo mà không cần kỹ thuật. Ngoài ra còn có: Vẽ tranh theo số, Nghệ thuật thủ công, Âm nhạc trị liệu (chơi nhạc cụ, hát), và Workshop sáng tạo nhóm. Mục đích là giải phóng cảm xúc, không phải tạo ra tác phẩm nghệ thuật.',
      category: 'Genii'
    },
    {
      question: 'Mutiny - Vườn Cách Mạng có an toàn không?',
      answer: 'Rất an toàn! Mutiny được thiết kế với tiêu chuẩn an toàn cao nhất. Phòng đập phá có đồ bảo hộ đầy đủ (mũ bảo hiểm, găng tay, kính bảo vệ), vật liệu đập phá được xử lý đặc biệt để không gây thương tích. Bắn cung có hướng dẫn viên chuyên nghiệp và thiết bị bảo hộ. Tất cả hoạt động đều có giám sát và tuân thủ quy trình an toàn nghiêm ngặt.',
      category: 'Mutiny'
    },
    {
      question: 'Có thể đặt phòng cho nhóm không?',
      answer: 'Có! Panacea hỗ trợ đặt phòng cho nhóm từ 2-20 người. Bạn có thể đặt "Phòng Nhóm" tại bất kỳ khu vực nào. Một số dịch vụ như Workshop tại Genii, Team Building tại Mutiny rất phù hợp cho nhóm. Giá sẽ được tính theo số người, có ưu đãi cho nhóm từ 5 người trở lên. Vui lòng liên hệ hotline để được tư vấn chi tiết.',
      category: 'Đặt phòng'
    },
    {
      question: 'Chính sách hoàn tiền khi hủy đặt phòng?',
      answer: 'Hủy trước 12 giờ: Hoàn 100% tiền. Hủy trước 6-12 giờ: Hoàn 50% tiền. Hủy dưới 6 giờ: Không hoàn tiền (có thể đổi sang lịch khác trong vòng 7 ngày). Tiền hoàn sẽ được chuyển về tài khoản trong 3-5 ngày làm việc. Trường hợp đặc biệt (ốm đau, tai nạn) vui lòng liên hệ hỗ trợ với giấy tờ chứng minh để được xem xét.',
      category: 'Thanh toán'
    },
    {
      question: 'Có thể dùng Panacea Points để thanh toán không?',
      answer: 'Có! Bạn có thể dùng Panacea Points để giảm giá hoặc thanh toán toàn bộ (nếu đủ điểm). 100 điểm = 10.000 VNĐ. Khi thanh toán, hệ thống sẽ tự động hiển thị số điểm bạn có và cho phép chọn phương thức thanh toán kết hợp (điểm + tiền mặt) hoặc chỉ dùng điểm. Điểm không có thời hạn sử dụng.',
      category: 'Panacea Points'
    },
    {
      question: 'Làm sao để nhận được nhiều Panacea Points?',
      answer: 'Bạn có thể tích điểm bằng cách: Đánh giá dịch vụ sau mỗi lần sử dụng (50 điểm), Đặt phòng thường xuyên (10 điểm/đơn), Giới thiệu bạn bè (100 điểm khi bạn bè đặt phòng lần đầu), Tham gia sự kiện đặc biệt (50-200 điểm), và Mua gói thành viên (tích điểm nhanh hơn 1.5x). Điểm được cộng tự động vào tài khoản sau mỗi hoạt động.',
      category: 'Panacea Points'
    },
    {
      question: 'Panacea có phục vụ vào cuối tuần không?',
      answer: 'Có! Panacea hoạt động từ 8:00 - 20:00 tất cả các ngày trong tuần, kể cả thứ 7 và Chủ nhật. Cuối tuần thường đông khách hơn, nên chúng tôi khuyến khích bạn đặt trước ít nhất 1-2 ngày để đảm bảo có slot. Một số dịch vụ đặc biệt như Workshop nhóm chỉ có vào cuối tuần.',
      category: 'Thông tin chung'
    },
    {
      question: 'Có thể mang theo đồ ăn, thức uống vào Panacea không?',
      answer: 'Bạn có thể mang nước uống vào các khu vực. Đồ ăn chỉ được phép tại khu vực nghỉ ngơi chung, không được mang vào phòng dịch vụ (để đảm bảo vệ sinh và trải nghiệm). Panacea có quán cà phê nhẹ tại tầng 1 với đồ uống và bánh ngọt. Một số gói combo bao gồm đồ uống miễn phí.',
      category: 'Thông tin chung'
    },
    {
      question: 'Tôi có thể đổi dịch vụ sau khi đã đặt không?',
      answer: 'Có thể đổi dịch vụ nếu còn slot trống và trước 12 giờ so với thời gian đặt. Vào "Đặt phòng của tôi", chọn "Đổi dịch vụ" và chọn dịch vụ mới. Nếu giá khác nhau, bạn sẽ được hoàn/thanh toán phần chênh lệch. Lưu ý: Không thể đổi sang khu vực khác nếu đã hết slot trong khung giờ đó.',
      category: 'Đặt phòng'
    },
    {
      question: 'Có chỗ để xe tại Panacea không?',
      answer: 'Có! Panacea có bãi đỗ xe miễn phí cho khách hàng (ô tô và xe máy). Bãi đỗ xe nằm ngay cạnh tòa nhà, có bảo vệ 24/7. Vào cuối tuần, bãi đỗ có thể đông, nên bạn nên đến sớm 10-15 phút. Nếu bãi đỗ đầy, có thể đỗ tại các bãi đỗ công cộng gần đó (có phí).',
      category: 'Thông tin chung'
    },
    {
      question: 'Tôi bị đau lưng, có thể tham gia Yoga tại Catharsis không?',
      answer: 'Có thể, nhưng bạn nên thông báo trước với giáo viên về tình trạng sức khỏe. Catharsis có các lớp "Yoga Trị Liệu" và "Yoga Nhẹ Nhàng" phù hợp cho người có vấn đề về lưng. Giáo viên sẽ điều chỉnh động tác phù hợp với bạn. Nếu đau lưng nghiêm trọng, chúng tôi khuyến nghị bạn tham khảo ý kiến bác sĩ trước.',
      category: 'Catharsis'
    },
    {
      question: 'Viết nhật ký trị liệu tại Oasis là gì?',
      answer: 'Đây là hoạt động giúp bạn ghi lại cảm xúc, suy nghĩ trong không gian yên tĩnh với hướng dẫn từ chuyên gia. Bạn sẽ được cung cấp sổ nhật ký đặc biệt, bút, và không gian riêng tư. Chuyên gia sẽ hướng dẫn cách viết để giải phóng cảm xúc, hiểu rõ bản thân hơn. Không cần biết viết hay, chỉ cần thành thật với chính mình.',
      category: 'Oasis'
    },
    {
      question: 'Mutiny có phù hợp cho người muốn giải tỏa cơn giận không?',
      answer: 'Hoàn toàn phù hợp! Mutiny được thiết kế đặc biệt để giúp bạn giải tỏa năng lượng tiêu cực một cách an toàn. Phòng đập phá cho phép bạn đập vỡ đồ vật (đã được xử lý an toàn) để giải phóng cảm xúc. Bắn cung cũng là cách tốt để tập trung và giải tỏa stress. Nhiều khách hàng cảm thấy nhẹ nhõm và bình tĩnh hơn sau khi tham gia.',
      category: 'Mutiny'
    },
    {
      question: 'Có thể mua gói thành viên tại Panacea không?',
      answer: 'Có! Panacea có các gói thành viên: Gói Cơ Bản (10 buổi, giá ưu đãi 15%), Gói Premium (20 buổi, giá ưu đãi 25%), và Gói VIP (không giới hạn, giá ưu đãi 35%). Thành viên còn được ưu tiên đặt slot, tích điểm nhanh hơn 1.5x, và nhận các ưu đãi đặc biệt. Gói có thời hạn 6 tháng hoặc 12 tháng, có thể gia hạn.',
      category: 'Thông tin chung'
    },
    {
      question: 'Panacea có hỗ trợ người khuyết tật không?',
      answer: 'Có! Panacea được thiết kế thân thiện với người khuyết tật. Tòa nhà có thang máy, lối đi rộng rãi, và nhà vệ sinh dành cho người khuyết tật. Một số dịch vụ như Yoga, Thiền có thể điều chỉnh để phù hợp. Vui lòng thông báo trước khi đặt phòng để chúng tôi chuẩn bị tốt nhất cho bạn.',
      category: 'Thông tin chung'
    },
    {
      question: 'Có thể đặt phòng qua điện thoại không?',
      answer: 'Chúng tôi khuyến khích đặt phòng qua website để tiện lợi và nhanh chóng. Tuy nhiên, nếu bạn gặp khó khăn với website, có thể gọi hotline +84 123 456 789 (8:00-20:00) để nhân viên hỗ trợ đặt phòng. Lưu ý: Đặt qua điện thoại vẫn cần thanh toán trước để xác nhận.',
      category: 'Đặt phòng'
    },
    {
      question: 'Tôi quên mật khẩu, làm sao để lấy lại?',
      answer: 'Vào trang đăng nhập, click "Quên mật khẩu", nhập email đã đăng ký. Hệ thống sẽ gửi link đặt lại mật khẩu qua email trong vòng 5 phút. Link có hiệu lực 1 giờ. Nếu không nhận được email, kiểm tra hộp thư rác hoặc liên hệ hỗ trợ. Bạn cũng có thể gọi hotline để được hỗ trợ trực tiếp.',
      category: 'Tài khoản'
    },
    {
      question: 'Có thể đặt phòng cho người khác không?',
      answer: 'Có thể! Khi đặt phòng, bạn có thể nhập thông tin người sử dụng dịch vụ (nếu khác với người đặt). Người sử dụng dịch vụ chỉ cần mang CMND/CCCD để xác nhận khi đến. Lưu ý: Người đặt phòng vẫn chịu trách nhiệm thanh toán và tuân thủ chính sách hủy/đổi.',
      category: 'Đặt phòng'
    }
  ];

  // Dữ liệu Tickets hardcode
  private readonly initialTickets: Ticket[] = [
    {
      id: 'T-INIT-001',
      name: 'Nguyễn Văn A',
      email: 'a.nguyen@example.com',
      category: 'Đặt phòng',
      subject: 'Không nhận được email xác nhận đặt phòng',
      message: 'Tôi đã đặt phòng Yoga tại Catharsis nhưng chưa nhận được email xác nhận. Vui lòng kiểm tra giúp tôi.',
      status: 'Open',
      createdAt: '2024-11-08T08:15:00.000Z'
    },
    {
      id: 'T-INIT-002',
      name: 'Trần Thị B',
      email: 'b.tran@example.com',
      category: 'Thanh toán',
      subject: 'Thanh toán bị trừ 2 lần',
      message: 'Tôi bị trừ tiền hai lần cho cùng một đặt phòng tại Oasis. Mã đặt phòng: OAS-2024-002',
      status: 'In Progress',
      createdAt: '2024-11-06T10:30:00.000Z'
    }
  ];

  private ticketsSubject = new BehaviorSubject<Ticket[]>(this.initialTickets);

  constructor() {
    // Khởi tạo tickets với dữ liệu hardcode
  }

  getFaqs(): Observable<FAQ[]> {
    return of(this.faqsData);
  }

  getTickets(): Observable<Ticket[]> {
    return this.ticketsSubject.asObservable();
  }

  createTicket(dto: CreateTicketDto): Observable<Ticket> {
    const newTicket: Ticket = {
      id: `T-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
      name: dto.name,
      email: dto.email,
      category: dto.category,
      subject: dto.subject,
      message: dto.message,
      attachmentUrl: dto.attachmentUrl,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    return of(newTicket).pipe(
      delay(800),
      tap((t) => this.ticketsSubject.next([t, ...this.ticketsSubject.getValue()]))
    );
  }
}