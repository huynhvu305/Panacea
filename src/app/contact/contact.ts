import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SEOService } from '../services/seo.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class ContactComponent implements OnInit {
  formData = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };
  
  isSubmitting = false;

  constructor(private seoService: SEOService) {}

  ngOnInit() {
    this.seoService.updateSEO({
      title: 'Liên hệ - Panacea',
      description: 'Liên hệ với Panacea - Không gian trị liệu và chữa lành tâm hồn. Địa chỉ: 60 Hai Bà Trưng, Bến Nghé, Quận 1, TP.HCM',
      keywords: 'Liên hệ Panacea, địa chỉ Panacea, hotline Panacea, email Panacea',
      image: '/assets/images/BACKGROUND.webp'
    });
  }

  onSubmit() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    setTimeout(() => {
      Swal.fire({
        title: 'Gửi thành công!',
        text: 'Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi sẽ phản hồi sớm nhất có thể.',
        icon: 'success',
        confirmButtonColor: '#132fba',
        confirmButtonText: 'Đóng'
      }).then(() => {
        this.formData = {
          name: '',
          email: '',
          phone: '',
          message: ''
        };
        this.isSubmitting = false;
      });
    }, 1000);
  }
}

