import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HeaderComponent } from './header';
import { AuthService } from '../services/auth';

// Fake AuthService cho test
class MockAuthService {
  private loggedIn = false;
  isLoggedIn() { return this.loggedIn; }
  setLoggedIn(v: boolean){ this.loggedIn = v; }
  getCurrentAccount() { return of({ ho_ten: 'Tester', diem_tich_luy: 0, diem_kha_dung: 0 }); }
  logout() {}
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let auth: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [{ provide: (window as any).AuthService ?? 'AuthService', useClass: MockAuthService }]
    }).overrideComponent(HeaderComponent, {
      set: { providers: [{ provide: AuthService, useClass: MockAuthService }] }
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle mobile menu', () => {
    expect(component.isOpen).toBeFalse();
    component.toggle(); expect(component.isOpen).toBeTrue();
    component.closeMenu(); expect(component.isOpen).toBeFalse();
  });

  it('should set membership class from points', () => {
    component.calculateMembership(60_000_000);
    expect(component.membershipClass).toBe('diamond');
  });
});
