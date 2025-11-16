import { Routes } from '@angular/router';
import { RegisterPageComponent } from './register-page/register-page';
import { CustomerAccountComponent } from './customer-account/customer-account';
import { AccountInformationComponent } from './account-information/account-information';
import { PasswordSecurityComponent } from './password-security/password-security';
import { CustomerCoinComponent } from './customer-coin/customer-coin';
import { CustomerStarComponent } from './customer-star/customer-star';
import { BookingHistoryComponent } from './booking-history/booking-history';
import { LoginPageComponent } from './login-page/login-page';
import { RoomList } from './room-list/room-list';
import { RoomDetail } from './room-detail/room-detail';
import { Payment } from './payment/payment';
import { Banking } from './banking/banking';
import { BlogListPage } from './blog-list-page/blog-list-page';
import { Star } from './star/star';
import { Coin } from './coin/coin';
import { Policy } from './policy/policy';
import { AboutUsComponent } from './about-us/about-us';
import { TermsComponent } from './terms/terms';
import { PrivacyComponent } from './privacy/privacy';
import { StoryComponent } from './story/story';
import { ExchangeLanding } from './exchange-landing/exchange-landing';
import { SupportPageComponent } from './support-page/support-page';
import { ReviewRoom } from './review-room/review-room';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { AdminUsers } from './admin-users/admin-users';
import { AdminBookings } from './admin-bookings/admin-bookings';
import { AdminRooms } from './admin-rooms/admin-rooms';
import { AdminServices } from './admin-services/admin-services';
import { AdminExchange } from './admin-exchange/admin-exchange';
import { AdminReviews } from './admin-reviews/admin-reviews';
import { adminGuard } from './guards/admin.guard';
import { CustomerBookingComponent } from './customer-booking/customer-booking';
import { ContactComponent } from './contact/contact';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./homepage').then(m => m.Homepage) 
  },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'room-list', component: RoomList },
  { path: 'room-detail/:slug', component: RoomDetail },
  { path: 'payment', component: Payment },
  { path: 'banking', component: Banking },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  {
    path: 'customer-account',
    component: CustomerAccountComponent,
    children: [
      { path: 'account-information', component: AccountInformationComponent },
      { path: 'password-security', component: PasswordSecurityComponent },
      { path: '', redirectTo: 'account-information', pathMatch: 'full' },
    ],
  },
  { path: 'customer-coin', component: CustomerCoinComponent },
  { path: 'customer-star', component: CustomerStarComponent },
  { path: 'booking-history', component: BookingHistoryComponent },
  { path: 'customer-booking', component: CustomerBookingComponent },
  { path: 'exchange-landing', component: ExchangeLanding },
  { path: 'support/center', component: SupportPageComponent },
  { path: 'support/reviews', component: ReviewRoom },
  { path: 'support/blog', component: BlogListPage },
  { path: 'support/star', component: Star },
  { path: 'support/coin', component: Coin },
  { path: 'policy/operating', component: Policy },
  { path: 'policy/privacy', component: PrivacyComponent },
  { path: 'about/about-us', component: AboutUsComponent },
  { path: 'about/panacea-story', component: StoryComponent },
  { path: 'about/contact', component: ContactComponent },
  { path: 'policy/termsofuse', component: TermsComponent },
  { path: 'admin-dashboard', component: AdminDashboard, canActivate: [adminGuard] },
  { path: 'admin-users', component: AdminUsers, canActivate: [adminGuard] },
  { path: 'admin-bookings', component: AdminBookings, canActivate: [adminGuard] },
  { path: 'admin-rooms', component: AdminRooms, canActivate: [adminGuard] },
  { path: 'admin-services', component: AdminServices, canActivate: [adminGuard] },
  { path: 'admin-exchange', component: AdminExchange, canActivate: [adminGuard] },
  { path: 'admin-reviews', component: AdminReviews, canActivate: [adminGuard] },
  { path: '**', redirectTo: '/' },
];

