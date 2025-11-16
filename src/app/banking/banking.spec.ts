import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Banking } from './banking';

describe('Banking', () => {
  let component: Banking;
  let fixture: ComponentFixture<Banking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Banking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Banking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
