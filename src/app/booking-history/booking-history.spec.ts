import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingHistory } from './booking-history';

describe('BookingHistory', () => {
  let component: BookingHistory;
  let fixture: ComponentFixture<BookingHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
