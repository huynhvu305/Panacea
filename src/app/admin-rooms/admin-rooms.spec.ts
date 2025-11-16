import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AdminRooms } from './admin-rooms';

describe('AdminRooms', () => {
  let component: AdminRooms;
  let fixture: ComponentFixture<AdminRooms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRooms, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminRooms);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

