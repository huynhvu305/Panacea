import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerCoin } from './customer-coin';

describe('CustomerCoin', () => {
  let component: CustomerCoin;
  let fixture: ComponentFixture<CustomerCoin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerCoin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerCoin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
