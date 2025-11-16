import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerStar } from './customer-star';

describe('CustomerStar', () => {
  let component: CustomerStar;
  let fixture: ComponentFixture<CustomerStar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerStar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerStar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
