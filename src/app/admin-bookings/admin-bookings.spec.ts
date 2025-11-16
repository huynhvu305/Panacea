import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AdminBookings } from './admin-bookings';

describe('AdminBookings', () => {
  let component: AdminBookings;
  let fixture: ComponentFixture<AdminBookings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBookings, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminBookings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

