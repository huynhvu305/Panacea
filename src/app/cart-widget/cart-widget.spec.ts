import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CartWidget } from './cart-widget';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

describe('CartWidget', () => {
  let component: CartWidget;
  let fixture: ComponentFixture<CartWidget>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartWidget, CommonModule, RouterModule.forRoot([])]
    }).compileComponents();

    fixture = TestBed.createComponent(CartWidget);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load cart from localStorage on init', () => {
    localStorage.setItem('cart', JSON.stringify([{ roomId: 1, roomName: 'Test Room' }]));
    component.ngOnInit();
    expect(component.cart.length).toBeGreaterThan(0);
  });

  it('should toggle cart open/close', () => {
    expect(component.isCartOpen).toBe(false);
    component.toggleCart();
    expect(component.isCartOpen).toBe(true);
    component.toggleCart();
    expect(component.isCartOpen).toBe(false);
  });

  it('should calculate cart count correctly', () => {
    localStorage.setItem('cart', JSON.stringify([
      { roomId: 1, date: '2025-01-01', time: '10:00 - 11:00' },
      { roomId: 1, date: '2025-01-01', time: '11:00 - 12:00' }
    ]));
    component.loadCart();
    expect(component.cartCount).toBeGreaterThan(0);
  });

  it('should hide cart on payment and banking routes', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue('/payment');
    expect(component.shouldShowCart).toBe(false);
  });
});

