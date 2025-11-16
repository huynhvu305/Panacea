import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangeLanding } from './exchange-landing';

describe('ExchangeLanding', () => {
  let component: ExchangeLanding;
  let fixture: ComponentFixture<ExchangeLanding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExchangeLanding]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExchangeLanding);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

