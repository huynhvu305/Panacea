import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerBookingComponent } from './customer-booking';

describe('CustomerBookingComponent', () => {
  let component: CustomerBookingComponent;
  let fixture: ComponentFixture<CustomerBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerBookingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

